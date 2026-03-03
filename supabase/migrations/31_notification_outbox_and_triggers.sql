-- ============================================
-- 31_notification_outbox_and_triggers.sql
--
-- 목표: notifications 테이블(기존)을 그대로 활용하면서
--       신뢰성 있는 외부 발송(LINE 등)을 위한 Outbox 패턴 추가
--
-- 변경 범위:
--   1. notification_outbox 테이블 신규 생성
--   2. claim_outbox_batch RPC (동시 처리 방지)
--   3. Postgres 트리거 3종 (bookings → notifications + outbox)
-- ============================================


-- ============================================
-- 1. ENUM 추가
-- ============================================

-- outbox 전용 상태 ENUM (notifications의 notification_status와 별개)
DO $$ BEGIN
  CREATE TYPE outbox_status AS ENUM (
    'pending',      -- 처리 대기
    'sending',      -- 처리 중 (동시 실행 방지 Lock)
    'sent',         -- 발송 완료
    'failed',       -- 재시도 횟수 초과 → 영구 실패
    'dead_letter'   -- 수동 확인 필요 (관리자 검토)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- 2. notification_outbox 테이블 생성
--
-- 역할: LINE/EMAIL 등 외부 채널 발송 Job 큐
--       notifications 테이블과 1:1 연결 (notification_id FK)
--       Outbox 패턴 핵심 컬럼 포함
-- ============================================
CREATE TABLE IF NOT EXISTS notification_outbox (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- notifications 테이블과 연결 (발송 로그 참조용)
  notification_id       UUID REFERENCES notifications(id) ON DELETE SET NULL,

  -- 컨텍스트
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  booking_id            UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- 채널 + 타입
  channel               notification_channel NOT NULL DEFAULT 'LINE',
  notification_type     notification_type NOT NULL,

  -- 수신자 (트리거 시점에 확정 → 발송 시 재조회 불필요)
  recipient_line_user_id TEXT,                                         -- LINE user ID
  recipient_customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 발송 payload (Edge Function이 그대로 사용)
  -- { "line_message": { "type": "text", "text": "..." }, "title": "...", "body": "..." }
  payload               JSONB NOT NULL,

  -- ── Outbox 핵심 컬럼 ──────────────────────────────
  -- 중복 발송 방지: booking_id + notification_type + 날짜 조합
  -- 예: 'abc123:BOOKING_CONFIRMED:2026-03-05'
  idempotency_key       TEXT UNIQUE NOT NULL,

  -- 발송 상태
  status                outbox_status NOT NULL DEFAULT 'pending',

  -- 재시도 관리
  attempt_count         SMALLINT NOT NULL DEFAULT 0,
  max_attempts          SMALLINT NOT NULL DEFAULT 5,
  next_retry_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 에러 로깅
  last_error            TEXT,

  -- 완료 시간
  sent_at               TIMESTAMPTZ,

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Edge Function 폴링 최적화 인덱스
CREATE INDEX idx_outbox_pending
  ON notification_outbox(next_retry_at)
  WHERE status = 'pending';

CREATE INDEX idx_outbox_salon
  ON notification_outbox(salon_id);

CREATE INDEX idx_outbox_booking
  ON notification_outbox(booking_id)
  WHERE booking_id IS NOT NULL;

-- updated_at 자동 갱신
CREATE TRIGGER update_notification_outbox_updated_at
BEFORE UPDATE ON notification_outbox
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE notification_outbox IS
  'LINE/Email 등 외부 채널 발송 Job 큐. Outbox 패턴으로 누락/중복 방지.';
COMMENT ON COLUMN notification_outbox.notification_id IS
  'notifications 테이블 레코드 참조 (발송 로그 연결)';
COMMENT ON COLUMN notification_outbox.idempotency_key IS
  '중복 발송 방지 키. 형식: {booking_id}:{type}:{YYYY-MM-DD}';
COMMENT ON COLUMN notification_outbox.payload IS
  '발송에 필요한 모든 데이터. Edge Function이 추가 조회 없이 사용 가능.';


-- ============================================
-- 3. RLS: 유저/어드민 직접 접근 완전 차단
--    Edge Function (service_role) 만 접근 가능
-- ============================================
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

-- 모든 역할 접근 불가 (service_role은 RLS 우회)
CREATE POLICY "outbox_no_direct_access"
  ON notification_outbox FOR ALL
  USING (false)
  WITH CHECK (false);


-- ============================================
-- 4. claim_outbox_batch RPC
--
-- pending → sending 으로 원자적 전환
-- FOR UPDATE SKIP LOCKED: 여러 Edge Function 동시 실행 시
--   같은 레코드 중복 처리 완전 방지
-- ============================================
CREATE OR REPLACE FUNCTION claim_outbox_batch(p_limit INT DEFAULT 20)
RETURNS SETOF notification_outbox
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE notification_outbox
  SET
    status     = 'sending',
    updated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM   notification_outbox
    WHERE  status        = 'pending'
      AND  next_retry_at <= NOW()
    ORDER  BY next_retry_at ASC
    LIMIT  p_limit
    FOR UPDATE SKIP LOCKED   -- 핵심: 동시 실행 안전 보장
  )
  RETURNING *;
$$;

COMMENT ON FUNCTION claim_outbox_batch IS
  'pending 레코드를 sending으로 원자적 전환. FOR UPDATE SKIP LOCKED로 동시 처리 방지.';


-- ============================================
-- 5. 공통 헬퍼: 예약 정보 조회 + 포맷
-- ============================================
CREATE OR REPLACE FUNCTION get_booking_notification_data(p_booking_id UUID)
RETURNS TABLE (
  salon_id        UUID,
  customer_id     UUID,
  artist_id       UUID,
  service_id      UUID,
  booking_date    DATE,
  start_time      TEXT,
  customer_name   TEXT,
  artist_name     TEXT,
  salon_name      TEXT,
  service_name    TEXT,
  line_user_id    TEXT,
  opt_out         BOOLEAN,
  line_blocked    BOOLEAN,
  formatted_date  TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    b.salon_id,
    b.customer_id,
    b.artist_id,
    b.service_id,
    b.booking_date,
    LEFT(b.start_time::TEXT, 5)                   AS start_time,
    c.name                                         AS customer_name,
    u.name                                         AS artist_name,
    s.name                                         AS salon_name,
    COALESCE(sc.name, sv.name)                     AS service_name,
    c.line_user_id,
    COALESCE(c.opt_out, false)                     AS opt_out,
    COALESCE(c.line_blocked, false)                AS line_blocked,
    -- 포맷: "03월 05일 (수) 14:00"
    TO_CHAR(b.booking_date, 'MM월 DD일')
      || ' (' || TRIM(TO_CHAR(b.booking_date, 'Dy')) || ') '
      || LEFT(b.start_time::TEXT, 5)               AS formatted_date
  FROM  bookings b
  JOIN  customers c  ON c.id = b.customer_id
  JOIN  users u      ON u.id = b.artist_id
  JOIN  salons s     ON s.id = b.salon_id
  LEFT JOIN services sv        ON sv.id = b.service_id
  LEFT JOIN service_categories sc ON sc.id = sv.category_id
  WHERE b.id = p_booking_id;
$$;


-- ============================================
-- 6. 트리거 1: 예약 생성 (INSERT)
--    → notifications (IN_APP / ADMIN) 생성
--    → Realtime 이 어드민에게 즉시 푸시
-- ============================================
CREATE OR REPLACE FUNCTION trg_on_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_d        RECORD;  -- booking notification data
  v_owner    RECORD;  -- staff_profiles owner
BEGIN
  -- 예약 정보 조회
  SELECT * INTO v_d
  FROM get_booking_notification_data(NEW.id);

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- 살롱 오너/어드민에게 IN_APP 알림 생성 (Realtime 트리거용)
  FOR v_owner IN
    SELECT sp.user_id
    FROM   staff_profiles sp
    WHERE  sp.salon_id  = NEW.salon_id
      AND  sp.is_owner  = true
  LOOP
    INSERT INTO notifications (
      salon_id, booking_id,
      recipient_type, recipient_user_id,
      notification_type, channel,
      title, body,
      metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id,
      'ADMIN', v_owner.user_id,
      'BOOKING_REQUEST', 'IN_APP',
      '새 예약 요청',
      v_d.formatted_date || ' ' || COALESCE(v_d.artist_name, '') ||
        ' | ' || COALESCE(v_d.customer_name, '고객') || '님',
      jsonb_build_object(
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time
      ),
      'PENDING'
    );
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 알림 생성 실패가 예약 생성을 막지 않도록
    RAISE LOG '[trg_on_booking_insert] error for booking %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_inserted
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION trg_on_booking_insert();

COMMENT ON FUNCTION trg_on_booking_insert IS
  '예약 생성 시 어드민에게 IN_APP 알림 생성. Supabase Realtime으로 즉시 전달.';


-- ============================================
-- 7. 트리거 2: 예약 일정 변경 (UPDATE)
--    → booking_meta.reschedule_pending false→true 시
--    → notifications (IN_APP / ADMIN) 생성
-- ============================================
CREATE OR REPLACE FUNCTION trg_on_booking_rescheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_d        RECORD;
  v_owner    RECORD;
  v_was_pending BOOLEAN;
  v_now_pending BOOLEAN;
BEGIN
  v_was_pending := COALESCE((OLD.booking_meta->>'reschedule_pending')::boolean, false);
  v_now_pending := COALESCE((NEW.booking_meta->>'reschedule_pending')::boolean, false);

  -- reschedule_pending 이 false → true 로 바뀐 경우만 처리
  IF v_was_pending OR NOT v_now_pending THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_d
  FROM get_booking_notification_data(NEW.id);

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  FOR v_owner IN
    SELECT sp.user_id
    FROM   staff_profiles sp
    WHERE  sp.salon_id = NEW.salon_id
      AND  sp.is_owner = true
  LOOP
    INSERT INTO notifications (
      salon_id, booking_id,
      recipient_type, recipient_user_id,
      notification_type, channel,
      title, body,
      metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id,
      'ADMIN', v_owner.user_id,
      'BOOKING_MODIFIED', 'IN_APP',
      '예약 일정 변경 요청',
      COALESCE(v_d.customer_name, '고객') || '님 → ' || v_d.formatted_date,
      jsonb_build_object(
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time
      ),
      'PENDING'
    );
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[trg_on_booking_rescheduled] error for booking %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- booking_meta 변경 시만 실행 (성능 최적화)
CREATE TRIGGER trg_booking_rescheduled
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.booking_meta IS DISTINCT FROM NEW.booking_meta)
EXECUTE FUNCTION trg_on_booking_rescheduled();

COMMENT ON FUNCTION trg_on_booking_rescheduled IS
  '유저가 예약 변경(reschedule_pending=true) 시 어드민 IN_APP 알림 생성.';


-- ============================================
-- 8. 트리거 3: 예약 상태 변경 (UPDATE status)
--    → CONFIRMED / CANCELLED 시
--    → notifications (LINE / CUSTOMER) 로그 생성
--    → notification_outbox 에 발송 Job 생성
--    이 두 INSERT가 같은 트랜잭션 → 원자적 보장
-- ============================================
CREATE OR REPLACE FUNCTION trg_on_booking_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_d               RECORD;
  v_notif_type      notification_type;
  v_title           TEXT;
  v_body            TEXT;
  v_is_reschedule   BOOLEAN;
  v_idempotency_key TEXT;
  v_notif_id        UUID;
  v_line_msg        JSONB;
BEGIN
  -- 상태가 실제로 변경됐는지 확인
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- CONFIRMED / CANCELLED 외에는 무시
  IF NEW.status NOT IN ('CONFIRMED', 'CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- 예약 정보 조회
  SELECT * INTO v_d
  FROM get_booking_notification_data(NEW.id);

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- LINE 발송 불가 조건 → outbox 생성 스킵
  -- (notifications 로그만 생성해도 됨)
  IF v_d.line_user_id IS NULL OR v_d.opt_out OR v_d.line_blocked THEN
    RETURN NEW;
  END IF;

  -- ── 알림 타입 / 메시지 결정 ──────────────────────
  IF NEW.status = 'CONFIRMED' THEN
    v_is_reschedule :=
      COALESCE((NEW.booking_meta->>'reschedule_pending')::boolean, false);

    IF v_is_reschedule THEN
      v_notif_type := 'BOOKING_MODIFIED';
      v_title      := COALESCE(v_d.salon_name, '') || ' 예약 변경 확정';
      v_body       := v_d.customer_name || '님, '
                        || v_d.formatted_date || ' '
                        || COALESCE(v_d.artist_name, '') || '님과의 '
                        || COALESCE(v_d.service_name, '') || ' 예약 변경이 확정되었습니다.';
    ELSE
      v_notif_type := 'BOOKING_CONFIRMED';
      v_title      := COALESCE(v_d.salon_name, '') || ' 예약 확정';
      v_body       := v_d.customer_name || '님, '
                        || v_d.formatted_date || ' '
                        || COALESCE(v_d.artist_name, '') || '님과의 '
                        || COALESCE(v_d.service_name, '') || ' 예약이 확정되었습니다.';
    END IF;

  ELSE  -- CANCELLED
    v_notif_type := 'BOOKING_CANCELLED';
    v_title      := COALESCE(v_d.salon_name, '') || ' 예약 취소';
    v_body       := v_d.customer_name || '님, '
                      || v_d.formatted_date || ' '
                      || COALESCE(v_d.service_name, '') || ' 예약이 취소되었습니다.';
  END IF;

  v_line_msg := jsonb_build_object('type', 'text', 'text', v_title || E'\n\n' || v_body);

  -- ── Step A: notifications 테이블에 LINE 로그 레코드 INSERT ──
  INSERT INTO notifications (
    salon_id, booking_id,
    recipient_type, recipient_customer_id,
    notification_type, channel,
    title, body,
    metadata, status
  ) VALUES (
    NEW.salon_id, NEW.id,
    'CUSTOMER', v_d.customer_id,
    v_notif_type, 'LINE',
    v_title, v_body,
    jsonb_build_object(
      'artist_name',   v_d.artist_name,
      'customer_name', v_d.customer_name,
      'service_name',  v_d.service_name,
      'booking_date',  v_d.booking_date,
      'start_time',    v_d.start_time
    ),
    'PENDING'  -- outbox가 처리 후 SENT로 업데이트
  )
  RETURNING id INTO v_notif_id;

  -- ── Step B: notification_outbox 에 발송 Job INSERT ──
  -- idempotency_key: 같은 booking + 같은 event + 같은 날 → 1회만
  v_idempotency_key :=
    NEW.id::TEXT || ':' || v_notif_type::TEXT || ':' || TO_CHAR(NOW(), 'YYYY-MM-DD');

  INSERT INTO notification_outbox (
    notification_id,
    salon_id, booking_id,
    channel, notification_type,
    recipient_line_user_id, recipient_customer_id,
    payload,
    idempotency_key,
    status, next_retry_at
  ) VALUES (
    v_notif_id,                  -- notifications 로그와 연결
    NEW.salon_id, NEW.id,
    'LINE', v_notif_type,
    v_d.line_user_id, v_d.customer_id,
    jsonb_build_object(
      'title',        v_title,
      'body',         v_body,
      'line_message', v_line_msg,
      'artist_name',  v_d.artist_name,
      'customer_name',v_d.customer_name,
      'service_name', v_d.service_name,
      'booking_date', v_d.booking_date,
      'start_time',   v_d.start_time
    ),
    v_idempotency_key,
    'pending', NOW()
  )
  ON CONFLICT (idempotency_key) DO NOTHING;  -- 중복 이벤트 완전 무시

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[trg_on_booking_status_changed] error for booking %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- status 변경 시만 실행
CREATE TRIGGER trg_booking_status_changed
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_on_booking_status_changed();

COMMENT ON FUNCTION trg_on_booking_status_changed IS
  'booking status CONFIRMED/CANCELLED 시 notifications(LINE 로그) + notification_outbox(발송 Job) 원자적 생성.';
