-- ============================================
-- LINE Push Automation: 재예약 자동화 + 노쇼 방지 + 휴면 복귀
-- ============================================

-- ============================================
-- 1. 기존 테이블 필드 추가
-- ============================================

-- services: 기본 시술 주기 (일 단위)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS default_cycle_days INTEGER;

COMMENT ON COLUMN services.default_cycle_days IS '시술 권장 재방문 주기 (일). 예: 컷=30, 펌=90, 염색=45';

-- bookings: 시술 완료 시각
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bookings.completed_at IS '시술 완료 처리된 시각';

-- customers: 마케팅 수신 거부
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS opt_out BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN customers.opt_out IS '마케팅 메시지 수신 거부 여부';

-- ============================================
-- 2. customer_cycles 테이블 (고객별 시술 주기 관리)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  cycle_days INTEGER NOT NULL DEFAULT 30,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, customer_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_cycles_next_due
  ON customer_cycles(next_due_at) WHERE next_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_cycles_customer
  ON customer_cycles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_cycles_salon
  ON customer_cycles(salon_id);

COMMENT ON TABLE customer_cycles IS '고객별 시술 주기 관리. 마지막 시술일 기반으로 다음 방문 예정일 계산';
COMMENT ON COLUMN customer_cycles.cycle_days IS '재방문 주기(일). 고객별 커스텀 가능, 기본값은 서비스의 default_cycle_days';
COMMENT ON COLUMN customer_cycles.next_due_at IS '다음 방문 예정일. last_completed_at + cycle_days';

-- updated_at 트리거
CREATE TRIGGER update_customer_cycles_updated_at
BEFORE UPDATE ON customer_cycles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. message_jobs 테이블 (발송 큐)
-- ============================================
CREATE TABLE IF NOT EXISTS message_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('rebook_due', 'rebook_overdue', 'reminder_24h', 'reminder_3h')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_jobs_status_scheduled
  ON message_jobs(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_jobs_customer_type_sent
  ON message_jobs(customer_id, job_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_message_jobs_salon
  ON message_jobs(salon_id);
CREATE INDEX IF NOT EXISTS idx_message_jobs_booking
  ON message_jobs(booking_id) WHERE booking_id IS NOT NULL;

COMMENT ON TABLE message_jobs IS 'LINE Push 메시지 발송 큐. 스케줄러가 주기적으로 처리';
COMMENT ON COLUMN message_jobs.job_type IS 'rebook_due=재예약 알림, rebook_overdue=휴면 복귀, reminder_24h/3h=예약 리마인더';
COMMENT ON COLUMN message_jobs.payload IS 'LINE 메시지 생성에 필요한 데이터 (고객명, 서비스명, 예약링크 등)';

-- updated_at 트리거
CREATE TRIGGER update_message_jobs_updated_at
BEFORE UPDATE ON message_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. message_events 테이블 (발송/클릭 이벤트 로깅)
-- ============================================
CREATE TABLE IF NOT EXISTS message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_job_id UUID NOT NULL REFERENCES message_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'clicked', 'converted')),
  event_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_message_events_job
  ON message_events(message_job_id);
CREATE INDEX IF NOT EXISTS idx_message_events_type
  ON message_events(event_type, event_at);

COMMENT ON TABLE message_events IS '메시지 이벤트 로깅. sent=발송, clicked=링크클릭, converted=예약전환';

-- ============================================
-- 5. RLS Policies
-- ============================================

-- customer_cycles RLS
ALTER TABLE customer_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their customer_cycles"
  ON customer_cycles FOR SELECT
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon staff can manage their customer_cycles"
  ON customer_cycles FOR ALL
  USING (salon_id = get_my_salon_id());

-- message_jobs RLS (관리자만 조회, 삽입/수정은 service role만)
ALTER TABLE message_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their message_jobs"
  ON message_jobs FOR SELECT
  USING (salon_id = get_my_salon_id());

-- message_events RLS (관리자만 조회)
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their message_events"
  ON message_events FOR SELECT
  USING (
    message_job_id IN (
      SELECT id FROM message_jobs WHERE salon_id = get_my_salon_id()
    )
  );

-- ============================================
-- 6. Trigger: 예약 완료 시 customer_cycles 자동 갱신
-- ============================================
CREATE OR REPLACE FUNCTION handle_booking_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cycle_days INTEGER;
  v_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 상태가 COMPLETED로 변경된 경우만 처리
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN

    -- completed_at 설정
    v_completed_at := COALESCE(NEW.completed_at, NOW());
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := v_completed_at;
    END IF;

    -- cycle_days 결정: 기존 customer_cycles > services.default_cycle_days > 30일 기본값
    SELECT COALESCE(cc.cycle_days, s.default_cycle_days, 30)
    INTO v_cycle_days
    FROM services s
    LEFT JOIN customer_cycles cc
      ON cc.salon_id = NEW.salon_id
      AND cc.customer_id = NEW.customer_id
      AND cc.service_id = NEW.service_id
    WHERE s.id = NEW.service_id;

    -- 기본값 fallback
    IF v_cycle_days IS NULL THEN
      v_cycle_days := 30;
    END IF;

    -- customer_cycles upsert
    INSERT INTO customer_cycles (
      salon_id, customer_id, service_id,
      cycle_days, last_completed_at, next_due_at
    )
    VALUES (
      NEW.salon_id, NEW.customer_id, NEW.service_id,
      v_cycle_days,
      v_completed_at,
      v_completed_at + (v_cycle_days || ' days')::INTERVAL
    )
    ON CONFLICT (salon_id, customer_id, service_id)
    DO UPDATE SET
      last_completed_at = EXCLUDED.last_completed_at,
      next_due_at = EXCLUDED.next_due_at,
      -- cycle_days는 이미 커스텀 설정된 경우 유지
      cycle_days = CASE
        WHEN customer_cycles.cycle_days != 30 AND customer_cycles.cycle_days != COALESCE(
          (SELECT default_cycle_days FROM services WHERE id = NEW.service_id), 30
        )
        THEN customer_cycles.cycle_days
        ELSE EXCLUDED.cycle_days
      END,
      updated_at = NOW();

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_completed
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION handle_booking_completed();

COMMENT ON FUNCTION handle_booking_completed IS '예약이 COMPLETED 상태로 변경될 때 customer_cycles를 자동 upsert';

-- ============================================
-- 7. RPC Functions: enqueue 대상 조회
-- ============================================

-- 7a. rebook_due 대상: next_due_at - 3일 ~ next_due_at + 1일
CREATE OR REPLACE FUNCTION get_rebook_due_targets()
RETURNS TABLE (
  salon_id UUID,
  customer_id UUID,
  service_id UUID,
  customer_name TEXT,
  service_name TEXT,
  salon_name TEXT,
  line_user_id TEXT,
  locale TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (cc.customer_id, cc.service_id)
    cc.salon_id,
    cc.customer_id,
    cc.service_id,
    c.name AS customer_name,
    COALESCE(s.name_en, s.name) AS service_name,
    sal.name AS salon_name,
    c.line_user_id,
    COALESCE(sal.settings->>'locale', 'en') AS locale
  FROM customer_cycles cc
  JOIN customers c ON c.id = cc.customer_id
  JOIN services s ON s.id = cc.service_id
  JOIN salons sal ON sal.id = cc.salon_id
  WHERE cc.next_due_at IS NOT NULL
    -- next_due_at - 3일 ~ next_due_at + 1일 범위
    AND NOW() >= cc.next_due_at - INTERVAL '3 days'
    AND NOW() < cc.next_due_at + INTERVAL '1 day'
    -- opt_out 아닌 고객만
    AND c.opt_out = false
    -- line_user_id 있는 고객만
    AND c.line_user_id IS NOT NULL
    -- 14일 내 동일 타입 발송 이력 없음
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.customer_id = cc.customer_id
        AND mj.job_type = 'rebook_due'
        AND mj.status = 'sent'
        AND mj.sent_at >= NOW() - INTERVAL '14 days'
    )
    -- 미래 예약이 없음
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customer_id = cc.customer_id
        AND b.status IN ('PENDING', 'CONFIRMED')
        AND b.booking_date >= CURRENT_DATE
    )
    -- 활성 살롱만
    AND sal.is_active = true;
$$;

COMMENT ON FUNCTION get_rebook_due_targets IS '재예약 알림(rebook_due) 대상 고객 조회. next_due_at 3일 전부터 대상';

-- 7b. rebook_overdue 대상: next_due_at + 7일 ~ +21일
CREATE OR REPLACE FUNCTION get_rebook_overdue_targets()
RETURNS TABLE (
  salon_id UUID,
  customer_id UUID,
  service_id UUID,
  customer_name TEXT,
  service_name TEXT,
  salon_name TEXT,
  line_user_id TEXT,
  locale TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (cc.customer_id, cc.service_id)
    cc.salon_id,
    cc.customer_id,
    cc.service_id,
    c.name AS customer_name,
    COALESCE(s.name_en, s.name) AS service_name,
    sal.name AS salon_name,
    c.line_user_id,
    COALESCE(sal.settings->>'locale', 'en') AS locale
  FROM customer_cycles cc
  JOIN customers c ON c.id = cc.customer_id
  JOIN services s ON s.id = cc.service_id
  JOIN salons sal ON sal.id = cc.salon_id
  WHERE cc.next_due_at IS NOT NULL
    AND NOW() >= cc.next_due_at + INTERVAL '7 days'
    AND NOW() < cc.next_due_at + INTERVAL '21 days'
    AND c.opt_out = false
    AND c.line_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.customer_id = cc.customer_id
        AND mj.job_type = 'rebook_overdue'
        AND mj.status = 'sent'
        AND mj.sent_at >= NOW() - INTERVAL '14 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customer_id = cc.customer_id
        AND b.status IN ('PENDING', 'CONFIRMED')
        AND b.booking_date >= CURRENT_DATE
    )
    AND sal.is_active = true;
$$;

COMMENT ON FUNCTION get_rebook_overdue_targets IS '휴면 복귀 알림(rebook_overdue) 대상 고객 조회. next_due_at 7일 이후부터 대상';

-- 7c. reminder_24h 대상: 예약 24시간 전 (±15분)
CREATE OR REPLACE FUNCTION get_reminder_24h_targets()
RETURNS TABLE (
  salon_id UUID,
  customer_id UUID,
  booking_id UUID,
  service_id UUID,
  customer_name TEXT,
  service_name TEXT,
  salon_name TEXT,
  line_user_id TEXT,
  booking_date TEXT,
  booking_time TEXT,
  artist_name TEXT,
  locale TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    b.salon_id,
    b.customer_id,
    b.id AS booking_id,
    b.service_id,
    c.name AS customer_name,
    COALESCE(s.name_en, s.name) AS service_name,
    sal.name AS salon_name,
    c.line_user_id,
    TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
    TO_CHAR(b.start_time, 'HH24:MI') AS booking_time,
    COALESCE(u.name, '') AS artist_name,
    COALESCE(sal.settings->>'locale', 'en') AS locale
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s ON s.id = b.service_id
  JOIN salons sal ON sal.id = b.salon_id
  LEFT JOIN users u ON u.id = b.artist_id
  WHERE b.status IN ('PENDING', 'CONFIRMED')
    -- booking_date + start_time이 24시간 후 ±15분
    AND (b.booking_date + b.start_time) >= NOW() + INTERVAL '23 hours 45 minutes'
    AND (b.booking_date + b.start_time) < NOW() + INTERVAL '24 hours 15 minutes'
    AND c.opt_out = false
    AND c.line_user_id IS NOT NULL
    -- 이미 이 예약에 대한 24h 리마인더가 발송되지 않았음
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.booking_id = b.id
        AND mj.job_type = 'reminder_24h'
        AND mj.status IN ('sent', 'pending')
    )
    AND sal.is_active = true;
$$;

COMMENT ON FUNCTION get_reminder_24h_targets IS '예약 24시간 전 리마인더 대상 조회';

-- 7d. reminder_3h 대상: 예약 3시간 전 (±15분)
CREATE OR REPLACE FUNCTION get_reminder_3h_targets()
RETURNS TABLE (
  salon_id UUID,
  customer_id UUID,
  booking_id UUID,
  service_id UUID,
  customer_name TEXT,
  service_name TEXT,
  salon_name TEXT,
  line_user_id TEXT,
  booking_date TEXT,
  booking_time TEXT,
  artist_name TEXT,
  locale TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    b.salon_id,
    b.customer_id,
    b.id AS booking_id,
    b.service_id,
    c.name AS customer_name,
    COALESCE(s.name_en, s.name) AS service_name,
    sal.name AS salon_name,
    c.line_user_id,
    TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
    TO_CHAR(b.start_time, 'HH24:MI') AS booking_time,
    COALESCE(u.name, '') AS artist_name,
    COALESCE(sal.settings->>'locale', 'en') AS locale
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s ON s.id = b.service_id
  JOIN salons sal ON sal.id = b.salon_id
  LEFT JOIN users u ON u.id = b.artist_id
  WHERE b.status IN ('PENDING', 'CONFIRMED')
    AND (b.booking_date + b.start_time) >= NOW() + INTERVAL '2 hours 45 minutes'
    AND (b.booking_date + b.start_time) < NOW() + INTERVAL '3 hours 15 minutes'
    AND c.opt_out = false
    AND c.line_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.booking_id = b.id
        AND mj.job_type = 'reminder_3h'
        AND mj.status IN ('sent', 'pending')
    )
    AND sal.is_active = true;
$$;

COMMENT ON FUNCTION get_reminder_3h_targets IS '예약 3시간 전 리마인더 대상 조회';

-- ============================================
-- 8. 대시보드 지표 뷰 (Materialized View는 추후, 일단 일반 뷰)
-- ============================================
CREATE OR REPLACE VIEW v_message_job_stats AS
SELECT
  mj.salon_id,
  mj.job_type,
  DATE_TRUNC('day', mj.created_at) AS day,
  COUNT(*) FILTER (WHERE mj.status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE mj.status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE mj.status = 'skipped') AS skipped_count,
  COUNT(*) FILTER (WHERE mj.status = 'pending') AS pending_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'clicked') AS click_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'converted') AS conversion_count
FROM message_jobs mj
LEFT JOIN message_events me ON me.message_job_id = mj.id
GROUP BY mj.salon_id, mj.job_type, DATE_TRUNC('day', mj.created_at);

COMMENT ON VIEW v_message_job_stats IS '살롱별/타입별/일별 메시지 발송 지표';
