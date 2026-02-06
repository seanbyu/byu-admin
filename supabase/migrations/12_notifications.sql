-- ============================================
-- Notifications System (알림 시스템)
-- ============================================

-- ============================================
-- 1. Notification Type ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'BOOKING_REQUEST',      -- 예약 요청 (어드민에게)
    'BOOKING_CONFIRMED',    -- 예약 확정 (고객에게)
    'BOOKING_CANCELLED',    -- 예약 취소 (양쪽에게)
    'BOOKING_REMINDER',     -- 예약 리마인더 (고객에게)
    'BOOKING_COMPLETED',    -- 시술 완료 (리뷰 요청)
    'BOOKING_NO_SHOW',      -- 노쇼 알림 (어드민에게)
    'BOOKING_MODIFIED',     -- 예약 변경 (양쪽에게)
    'REVIEW_RECEIVED',      -- 리뷰 등록됨 (어드민에게)
    'GENERAL'               -- 일반 알림
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'LINE',
    'EMAIL',
    'SMS',
    'PUSH',
    'IN_APP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'PENDING',    -- 발송 대기
    'SENT',       -- 발송 완료
    'DELIVERED',  -- 전달 확인
    'READ',       -- 읽음
    'FAILED'      -- 발송 실패
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recipient_type AS ENUM (
    'CUSTOMER',   -- 고객
    'ADMIN',      -- 살롱 관리자
    'ARTIST',     -- 담당 아티스트
    'STAFF'       -- 스태프
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. Notifications Table (알림 발송 로그)
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 살롱 (필수)
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- 관련 예약 (선택 - 예약 관련 알림인 경우)
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- 수신자 정보
  recipient_type recipient_type NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,      -- 어드민/아티스트인 경우
  recipient_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- 고객인 경우

  -- 알림 정보
  notification_type notification_type NOT NULL,
  channel notification_channel NOT NULL,

  -- 메시지 내용
  title TEXT,
  body TEXT NOT NULL,

  -- 메타데이터 (추가 정보)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "artist_name": "김디자이너",
  --   "booking_date": "2024-03-15",
  --   "booking_time": "14:00",
  --   "service_name": "컷 + 펌"
  -- }

  -- 발송 상태
  status notification_status NOT NULL DEFAULT 'PENDING',

  -- 발송 시간
  scheduled_at TIMESTAMP WITH TIME ZONE,  -- 예약 발송 시간 (null이면 즉시)
  sent_at TIMESTAMP WITH TIME ZONE,       -- 실제 발송 시간
  delivered_at TIMESTAMP WITH TIME ZONE,  -- 전달 확인 시간
  read_at TIMESTAMP WITH TIME ZONE,       -- 읽음 시간

  -- 실패 정보
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- 외부 서비스 응답
  external_message_id TEXT,  -- LINE message ID 등
  external_response JSONB,   -- 외부 서비스 응답 원본

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_salon ON notifications(salon_id);
CREATE INDEX idx_notifications_booking ON notifications(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_notifications_recipient_user ON notifications(recipient_user_id) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX idx_notifications_recipient_customer ON notifications(recipient_customer_id) WHERE recipient_customer_id IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'PENDING' AND scheduled_at IS NOT NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

COMMENT ON TABLE notifications IS '알림 발송 로그. 모든 알림(LINE, SMS, Email 등)의 발송 기록을 저장';
COMMENT ON COLUMN notifications.scheduled_at IS '예약 발송 시간. NULL이면 즉시 발송';
COMMENT ON COLUMN notifications.metadata IS '알림에 사용된 변수들 (아티스트명, 날짜, 시간 등)';

-- ============================================
-- 3. Salon LINE Settings (살롱별 LINE 연동 설정)
-- ============================================
CREATE TABLE salon_line_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE UNIQUE,

  -- LINE Channel 정보
  line_channel_id TEXT NOT NULL,
  line_channel_secret TEXT NOT NULL,  -- 암호화 필요
  line_channel_access_token TEXT NOT NULL,  -- 암호화 필요

  -- LINE LIFF 정보 (예약 웹앱용)
  liff_id TEXT,

  -- Webhook 설정
  webhook_url TEXT,
  webhook_secret TEXT,

  -- 상태
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,  -- 연동 검증 완료 여부

  -- 마지막 검증
  last_verified_at TIMESTAMP WITH TIME ZONE,
  verification_error TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE salon_line_settings IS '살롱별 LINE 공식계정 연동 설정';
COMMENT ON COLUMN salon_line_settings.line_channel_secret IS '암호화하여 저장 권장';
COMMENT ON COLUMN salon_line_settings.line_channel_access_token IS '암호화하여 저장 권장';

-- ============================================
-- 4. Bookings 테이블에 확정 정보 추가
-- ============================================
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bookings.confirmed_by IS '예약을 확정한 스태프 ID';
COMMENT ON COLUMN bookings.confirmed_at IS '예약 확정 시간';

-- Index for confirmed bookings
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed ON bookings(confirmed_at) WHERE confirmed_at IS NOT NULL;

-- ============================================
-- 5. Salons settings에 알림 설정 추가 (JSONB 확장)
-- ============================================
-- salons.settings 기본값에 notifications 추가는 애플리케이션 레벨에서 처리
-- 여기서는 예시 구조만 문서화

-- settings.notifications 예시:
-- {
--   "booking_request": {
--     "enabled": true,
--     "channels": ["LINE", "PUSH"],
--     "recipients": ["OWNER", "ASSIGNED_ARTIST"]
--   },
--   "booking_confirmed": {
--     "enabled": true,
--     "channels": ["LINE"]
--   },
--   "booking_reminder": {
--     "enabled": true,
--     "hours_before": [24, 2]
--   },
--   "booking_cancelled": {
--     "enabled": true,
--     "channels": ["LINE"]
--   }
-- }

-- ============================================
-- 6. RLS Policies for Notifications
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 살롱 스태프는 자기 살롱의 알림 조회 가능
CREATE POLICY "Salon staff can view their notifications"
  ON notifications FOR SELECT
  USING (salon_id = get_my_salon_id());

-- 고객은 자기 알림만 조회 가능
CREATE POLICY "Customers can view their own notifications"
  ON notifications FOR SELECT
  USING (
    recipient_customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- 살롱 스태프는 알림 생성 가능
CREATE POLICY "Salon staff can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

-- 시스템은 알림 상태 업데이트 가능 (service role 사용)
-- 애플리케이션에서 service role로 처리

-- ============================================
-- 7. RLS Policies for Salon LINE Settings
-- ============================================
ALTER TABLE salon_line_settings ENABLE ROW LEVEL SECURITY;

-- 살롱 관리자만 LINE 설정 조회/수정 가능
CREATE POLICY "Salon admins can view their LINE settings"
  ON salon_line_settings FOR SELECT
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Salon admins can manage their LINE settings"
  ON salon_line_settings FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================
-- 8. Triggers
-- ============================================

-- notifications updated_at 트리거
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- salon_line_settings updated_at 트리거
CREATE TRIGGER update_salon_line_settings_updated_at
BEFORE UPDATE ON salon_line_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. Helper Functions
-- ============================================

-- 예약 관련 알림 생성 함수
CREATE OR REPLACE FUNCTION create_booking_notification(
  p_booking_id UUID,
  p_notification_type notification_type,
  p_recipient_type recipient_type,
  p_channel notification_channel,
  p_title TEXT,
  p_body TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_booking RECORD;
BEGIN
  -- 예약 정보 조회
  SELECT b.*, s.id as salon_id, c.id as customer_id, c.user_id as customer_user_id
  INTO v_booking
  FROM bookings b
  JOIN salons s ON s.id = b.salon_id
  JOIN customers c ON c.id = b.customer_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- 알림 생성
  INSERT INTO notifications (
    salon_id,
    booking_id,
    recipient_type,
    recipient_user_id,
    recipient_customer_id,
    notification_type,
    channel,
    title,
    body,
    metadata,
    status
  )
  VALUES (
    v_booking.salon_id,
    p_booking_id,
    p_recipient_type,
    CASE
      WHEN p_recipient_type IN ('ADMIN', 'ARTIST', 'STAFF') THEN v_booking.artist_id
      ELSE NULL
    END,
    CASE
      WHEN p_recipient_type = 'CUSTOMER' THEN v_booking.customer_id
      ELSE NULL
    END,
    p_notification_type,
    p_channel,
    p_title,
    p_body,
    p_metadata,
    'PENDING'
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION create_booking_notification IS '예약 관련 알림을 생성합니다';
