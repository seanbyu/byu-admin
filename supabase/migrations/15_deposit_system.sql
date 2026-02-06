-- ============================================
-- Deposit System (예약금 시스템)
-- ============================================

-- ============================================
-- 1. ENUM 타입 정의
-- ============================================

-- 예약금 상태
DO $$ BEGIN
  CREATE TYPE deposit_status AS ENUM (
    'NOT_REQUIRED',       -- 예약금 불필요
    'PENDING',            -- 결제 대기
    'PAID',               -- 결제 완료
    'PARTIALLY_REFUNDED', -- 부분 환불
    'REFUNDED',           -- 전액 환불
    'FORFEITED'           -- 몰수 (노쇼/취소)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 결제 수단
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'CASH',               -- 현금
    'CREDIT_CARD',        -- 신용카드
    'DEBIT_CARD',         -- 체크카드
    'BANK_TRANSFER',      -- 계좌이체
    'PROMPTPAY',          -- 프롬프트페이 (태국)
    'LINE_PAY',           -- 라인페이
    'TRUE_MONEY',         -- 트루머니 (태국)
    'RABBIT_LINE_PAY',    -- 래빗 라인페이 (태국)
    'SHOPEE_PAY',         -- 쇼피페이
    'OTHER'               -- 기타
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 결제 상태
DO $$ BEGIN
  CREATE TYPE payment_transaction_status AS ENUM (
    'PENDING',            -- 대기
    'PROCESSING',         -- 처리 중
    'COMPLETED',          -- 완료
    'FAILED',             -- 실패
    'CANCELLED',          -- 취소
    'REFUNDED'            -- 환불됨
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 결제 유형
DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM (
    'DEPOSIT',            -- 예약금
    'FULL_PAYMENT',       -- 전액 결제
    'PARTIAL_PAYMENT',    -- 부분 결제
    'REFUND',             -- 환불
    'ADDITIONAL'          -- 추가 결제
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. Bookings 테이블에 예약금 필드 추가
-- ============================================

-- 예약금 필요 여부
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN NOT NULL DEFAULT false;

-- 예약금 금액
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);

-- 예약금 상태
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_status deposit_status DEFAULT 'NOT_REQUIRED';

-- 예약금 결제 시간
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP WITH TIME ZONE;

-- 예약금 결제 수단
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_payment_method payment_method;

-- 예약금 거래 ID (외부 결제 참조)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_transaction_id TEXT;

-- 예약금 환불 시간
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_refunded_at TIMESTAMP WITH TIME ZONE;

-- 예약금 환불 금액
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_refund_amount DECIMAL(10,2);

-- 예약금 몰수 시간
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_forfeited_at TIMESTAMP WITH TIME ZONE;

-- 예약금 관련 메모
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_notes TEXT;

-- 예약금 만료 시간 (결제 대기 시 자동 취소용)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_expires_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN bookings.deposit_required IS '예약금 필요 여부';
COMMENT ON COLUMN bookings.deposit_amount IS '예약금 금액';
COMMENT ON COLUMN bookings.deposit_status IS '예약금 상태';
COMMENT ON COLUMN bookings.deposit_paid_at IS '예약금 결제 시간';
COMMENT ON COLUMN bookings.deposit_payment_method IS '예약금 결제 수단';
COMMENT ON COLUMN bookings.deposit_transaction_id IS '외부 결제 거래 ID';
COMMENT ON COLUMN bookings.deposit_expires_at IS '예약금 결제 만료 시간 (미결제 시 자동 취소)';

-- 예약금 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_deposit_status
ON bookings(deposit_status) WHERE deposit_required = true;

CREATE INDEX IF NOT EXISTS idx_bookings_deposit_expires
ON bookings(deposit_expires_at) WHERE deposit_status = 'PENDING';

-- ============================================
-- 3. 결제 기록 테이블 (payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 결제 유형 및 금액
  payment_type payment_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',

  -- 결제 수단
  payment_method payment_method NOT NULL,

  -- 상태
  status payment_transaction_status NOT NULL DEFAULT 'PENDING',

  -- 외부 결제 정보
  provider VARCHAR(50),          -- 'STRIPE', 'OMISE', '2C2P', 'LINE_PAY' 등
  provider_transaction_id TEXT,  -- 외부 결제 거래 ID
  provider_response JSONB,       -- 외부 결제 응답 원본

  -- PromptPay 관련
  promptpay_qr_code TEXT,        -- QR 코드 데이터/URL
  promptpay_ref_id TEXT,         -- PromptPay 참조 번호

  -- 환불 관련 (환불인 경우)
  refund_of UUID REFERENCES payments(id) ON DELETE SET NULL,
  refund_reason TEXT,

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,
  -- 예: {
  --   "receipt_number": "RCP-2024-001234",
  --   "staff_id": "uuid",
  --   "notes": "현금 결제"
  -- }

  -- 처리 정보
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,

  -- 실패 정보
  error_code TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_payments_salon ON payments(salon_id);
CREATE INDEX idx_payments_booking ON payments(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_payments_customer ON payments(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_provider_tx ON payments(provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

COMMENT ON TABLE payments IS '모든 결제/환불 기록';
COMMENT ON COLUMN payments.provider IS '외부 결제 제공자 (STRIPE, OMISE, 2C2P 등)';
COMMENT ON COLUMN payments.promptpay_qr_code IS 'PromptPay QR 코드 데이터';
COMMENT ON COLUMN payments.promptpay_ref_id IS 'PromptPay 참조 번호';

-- ============================================
-- 4. 살롱 PromptPay 설정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS salon_promptpay_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE UNIQUE,

  -- PromptPay 계정 정보
  promptpay_id TEXT NOT NULL,           -- 전화번호 또는 국민ID
  promptpay_type VARCHAR(10) NOT NULL,  -- 'PHONE' 또는 'NATIONAL_ID'
  account_name TEXT NOT NULL,           -- 계좌주 이름 (표시용)

  -- QR 코드 설정
  qr_code_image TEXT,                   -- 정적 QR 코드 이미지 URL (선택)

  -- 은행 정보 (백업/확인용)
  bank_name TEXT,
  bank_account_number TEXT,

  -- 상태
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE salon_promptpay_settings IS '살롱별 PromptPay 설정';
COMMENT ON COLUMN salon_promptpay_settings.promptpay_id IS 'PromptPay ID (전화번호 또는 국민ID)';
COMMENT ON COLUMN salon_promptpay_settings.promptpay_type IS 'ID 유형: PHONE 또는 NATIONAL_ID';

-- ============================================
-- 5. Services 테이블에 예약금 오버라이드 추가
-- ============================================
ALTER TABLE services
ADD COLUMN IF NOT EXISTS deposit_override JSONB;

COMMENT ON COLUMN services.deposit_override IS '서비스별 예약금 설정 오버라이드';
-- 예: {
--   "enabled": true,
--   "type": "FIXED",      -- "FIXED" 또는 "PERCENTAGE"
--   "amount": 1000,       -- 고정금액 또는 퍼센트
--   "required_for": "ALL" -- "ALL", "NEW_CUSTOMER", "NO_SHOW_HISTORY"
-- }

-- ============================================
-- 6. salons.settings 예약금 설정 예시 (JSONB)
-- ============================================
-- salons.settings에 deposit 키로 추가
--
-- "deposit": {
--   "enabled": true,
--   "type": "PERCENTAGE",
--   "amount": 30,
--   "min_amount": 500,
--   "max_amount": 5000,
--   "required_for": "ALL",
--   "required_service_ids": [],
--   "payment_methods": ["PROMPTPAY", "LINE_PAY", "CREDIT_CARD", "BANK_TRANSFER"],
--   "payment_deadline_hours": 24,
--   "refund_policy": {
--     "full_refund_hours": 48,
--     "partial_refund_hours": 24,
--     "partial_refund_percent": 50
--   },
--   "no_show_forfeit": true
-- }

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Payments RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their payments"
  ON payments FOR SELECT
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Customers can view their own payments"
  ON payments FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Salon staff can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')
  );

CREATE POLICY "Salon managers can update payments"
  ON payments FOR UPDATE
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- PromptPay Settings RLS
ALTER TABLE salon_promptpay_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon admins can view their PromptPay settings"
  ON salon_promptpay_settings FOR SELECT
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Salon admins can manage their PromptPay settings"
  ON salon_promptpay_settings FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================
-- 8. Triggers
-- ============================================

-- payments updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- salon_promptpay_settings updated_at
CREATE TRIGGER update_salon_promptpay_settings_updated_at
BEFORE UPDATE ON salon_promptpay_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. 예약금 자동 몰수 함수 (노쇼 시)
-- ============================================
CREATE OR REPLACE FUNCTION forfeit_deposit_on_no_show()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 노쇼로 변경되고 예약금이 결제된 상태인 경우
  IF NEW.status = 'NO_SHOW' AND OLD.status != 'NO_SHOW'
     AND NEW.deposit_status = 'PAID' THEN

    -- 예약금 상태를 몰수로 변경
    NEW.deposit_status := 'FORFEITED';
    NEW.deposit_forfeited_at := NOW();
    NEW.deposit_notes := COALESCE(NEW.deposit_notes, '') ||
                         E'\n[자동] 노쇼로 인한 예약금 몰수 - ' || NOW()::TEXT;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forfeit_deposit_on_no_show ON bookings;

CREATE TRIGGER trg_forfeit_deposit_on_no_show
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION forfeit_deposit_on_no_show();

