-- ============================================
-- Membership System (정액권/멤버십 시스템)
-- ============================================

-- ============================================
-- 1. ENUM 타입 정의
-- ============================================

-- 정액권 유형
DO $$ BEGIN
  CREATE TYPE membership_type AS ENUM (
    'COUNT_BASED',    -- 횟수제 (예: 컷 10회권)
    'TIME_BASED',     -- 기간제 (예: 1개월 무제한)
    'AMOUNT_BASED',   -- 금액권 (예: 10만원 충전)
    'BUNDLE'          -- 패키지 (예: 컷+펌+염색 세트)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 정액권 상태
DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM (
    'ACTIVE',         -- 사용 가능
    'EXPIRED',        -- 만료됨
    'EXHAUSTED',      -- 소진됨 (횟수/금액 모두 사용)
    'SUSPENDED',      -- 일시정지
    'CANCELLED',      -- 취소됨
    'REFUNDED'        -- 환불됨
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 활성화 방식
DO $$ BEGIN
  CREATE TYPE activation_type AS ENUM (
    'IMMEDIATE',      -- 구매 즉시 시작
    'FIRST_USE'       -- 첫 사용 시 시작
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. 정액권 상품 테이블 (membership_plans)
-- ============================================
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- 기본 정보
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_th VARCHAR(100),
  description TEXT,
  image_url TEXT,

  -- 정액권 유형
  membership_type membership_type NOT NULL,

  -- 가격
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),  -- 정가 (할인 전)
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',

  -- ============================================
  -- 횟수제 (COUNT_BASED) 설정
  -- ============================================
  total_count INTEGER,           -- 총 이용 횟수
  bonus_count INTEGER DEFAULT 0, -- 보너스 횟수 (예: 10+1)

  -- ============================================
  -- 기간제 (TIME_BASED) 설정
  -- ============================================
  duration_days INTEGER,         -- 유효 기간 (일)
  usage_limit INTEGER,           -- 기간 내 이용 횟수 제한 (NULL=무제한)

  -- ============================================
  -- 금액권 (AMOUNT_BASED) 설정
  -- ============================================
  total_amount DECIMAL(10,2),    -- 충전 금액
  bonus_amount DECIMAL(10,2) DEFAULT 0, -- 보너스 금액

  -- ============================================
  -- 패키지 (BUNDLE) 설정
  -- ============================================
  bundle_items JSONB,
  -- 예: [
  --   {"service_id": "uuid", "count": 1},
  --   {"service_id": "uuid", "count": 2}
  -- ]

  -- ============================================
  -- 적용 서비스 설정
  -- ============================================
  all_services BOOLEAN NOT NULL DEFAULT false,  -- 전체 서비스 적용
  applicable_service_ids UUID[],                -- 적용 가능한 서비스 ID 목록
  applicable_category_ids UUID[],               -- 적용 가능한 카테고리 ID 목록

  -- ============================================
  -- 유효 기간 설정
  -- ============================================
  validity_days INTEGER,          -- 구매 후 유효 기간 (일)
  activation_type activation_type NOT NULL DEFAULT 'IMMEDIATE',

  -- ============================================
  -- 제한 사항
  -- ============================================
  max_per_customer INTEGER,       -- 1인당 최대 구매 수
  transferable BOOLEAN NOT NULL DEFAULT false,   -- 양도 가능 여부
  shareable BOOLEAN NOT NULL DEFAULT false,      -- 가족/친구 공유 가능

  -- ============================================
  -- 예약금 면제 설정 (중요!)
  -- ============================================
  deposit_exempt BOOLEAN NOT NULL DEFAULT true,  -- 예약금 면제 여부
  -- true: 이 정액권 보유자는 예약금 불필요
  -- false: 정액권 보유해도 예약금 별도 필요

  -- ============================================
  -- 판매 기간
  -- ============================================
  sale_start_date DATE,
  sale_end_date DATE,
  is_limited_quantity BOOLEAN NOT NULL DEFAULT false,
  total_quantity INTEGER,         -- 한정 판매 수량
  sold_quantity INTEGER NOT NULL DEFAULT 0,

  -- 상태
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_membership_plans_salon ON membership_plans(salon_id) WHERE is_active = true;
CREATE INDEX idx_membership_plans_type ON membership_plans(membership_type);

COMMENT ON TABLE membership_plans IS '살롱별 정액권/멤버십 상품';
COMMENT ON COLUMN membership_plans.deposit_exempt IS '이 정액권 보유자의 예약금 면제 여부';

-- ============================================
-- 3. 고객 정액권 테이블 (customer_memberships)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,

  -- 고유 번호
  membership_number VARCHAR(50) NOT NULL,

  -- 구매 정보
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- 판매 스태프
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- 구매 시점 가격 (플랜 가격 변경되어도 유지)
  purchase_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',

  -- ============================================
  -- 유효 기간
  -- ============================================
  starts_at TIMESTAMP WITH TIME ZONE,   -- 시작일 (첫 사용 시 설정될 수 있음)
  expires_at TIMESTAMP WITH TIME ZONE,  -- 만료일
  activation_type activation_type NOT NULL DEFAULT 'IMMEDIATE',

  -- ============================================
  -- 잔여 현황 (횟수제/금액권)
  -- ============================================
  initial_count INTEGER,          -- 최초 횟수
  remaining_count INTEGER,        -- 남은 횟수
  used_count INTEGER NOT NULL DEFAULT 0,

  initial_amount DECIMAL(10,2),   -- 최초 금액
  remaining_amount DECIMAL(10,2), -- 남은 금액
  used_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- ============================================
  -- 패키지 잔여 현황
  -- ============================================
  bundle_remaining JSONB,
  -- 예: [
  --   {"service_id": "uuid", "remaining": 1},
  --   {"service_id": "uuid", "remaining": 0}
  -- ]

  -- 상태
  status membership_status NOT NULL DEFAULT 'ACTIVE',

  -- ============================================
  -- 일시정지 (휴면) 관리
  -- ============================================
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_until TIMESTAMP WITH TIME ZONE,
  suspension_reason TEXT,
  total_suspension_days INTEGER NOT NULL DEFAULT 0,  -- 누적 일시정지 일수

  -- ============================================
  -- 환불 정보
  -- ============================================
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refund_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  -- 취소 정보
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 메모
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 유니크 제약
  UNIQUE(salon_id, membership_number)
);

-- 인덱스
CREATE INDEX idx_customer_memberships_salon ON customer_memberships(salon_id);
CREATE INDEX idx_customer_memberships_customer ON customer_memberships(customer_id);
CREATE INDEX idx_customer_memberships_status ON customer_memberships(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_customer_memberships_expires ON customer_memberships(expires_at)
  WHERE status = 'ACTIVE' AND expires_at IS NOT NULL;

COMMENT ON TABLE customer_memberships IS '고객이 보유한 정액권';

-- ============================================
-- 4. 정액권 사용 내역 테이블 (membership_usages)
-- ============================================
CREATE TABLE IF NOT EXISTS membership_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES customer_memberships(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,

  -- 차감 내용
  count_used INTEGER,              -- 차감 횟수
  amount_used DECIMAL(10,2),       -- 차감 금액

  -- 사용 후 잔여
  remaining_count_after INTEGER,
  remaining_amount_after DECIMAL(10,2),

  -- 사용 정보
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,

  -- 취소/환원
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_membership_usages_membership ON membership_usages(membership_id);
CREATE INDEX idx_membership_usages_booking ON membership_usages(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_membership_usages_used_at ON membership_usages(used_at DESC);

COMMENT ON TABLE membership_usages IS '정액권 사용 내역';

-- ============================================
-- 5. Bookings 테이블에 정액권 연결 필드 추가
-- ============================================

-- 사용된 정액권 ID
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES customer_memberships(id) ON DELETE SET NULL;

-- 정액권 사용 내역 ID
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS membership_usage_id UUID REFERENCES membership_usages(id) ON DELETE SET NULL;

-- 정액권으로 인한 예약금 면제 여부
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposit_exempt_by_membership BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN bookings.membership_id IS '이 예약에 사용된 정액권';
COMMENT ON COLUMN bookings.membership_usage_id IS '정액권 사용 내역 참조';
COMMENT ON COLUMN bookings.deposit_exempt_by_membership IS '정액권으로 인한 예약금 면제';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_membership ON bookings(membership_id)
  WHERE membership_id IS NOT NULL;

-- ============================================
-- 6. 살롱 설정 확장 (정액권 + 예약금 연계)
-- ============================================
-- salons.settings에 membership 키로 추가
--
-- "membership": {
--   "enabled": true,
--   "allow_suspension": true,
--   "max_suspension_days": 30,
--   "suspension_extends_expiry": true,
--   "notify_expiry_days": [30, 7, 1],
--   "auto_activate_on_first_use": true,
--   "deposit_policy": {
--     "exempt_active_membership": true,
--     "exempt_membership_types": ["COUNT_BASED", "TIME_BASED"],
--     "require_deposit_for_amount_based": false
--   },
--   "refund_policy": {
--     "allowed": true,
--     "min_remaining_percent": 50,
--     "deduct_used_at_regular_price": true,
--     "admin_fee": 0
--   }
-- }

-- ============================================
-- 7. 예약금 면제 확인 함수
-- ============================================
CREATE OR REPLACE FUNCTION check_deposit_exempt_by_membership(
  p_customer_id UUID,
  p_salon_id UUID,
  p_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_exempt BOOLEAN,
  membership_id UUID,
  membership_name TEXT,
  remaining_count INTEGER,
  remaining_amount DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN cm.id IS NOT NULL AND mp.deposit_exempt = true THEN true ELSE false END AS is_exempt,
    cm.id AS membership_id,
    mp.name AS membership_name,
    cm.remaining_count,
    cm.remaining_amount
  FROM customer_memberships cm
  JOIN membership_plans mp ON mp.id = cm.plan_id
  WHERE cm.customer_id = p_customer_id
    AND cm.salon_id = p_salon_id
    AND cm.status = 'ACTIVE'
    AND (cm.expires_at IS NULL OR cm.expires_at > NOW())
    AND (
      -- 횟수가 남아있거나
      (cm.remaining_count IS NOT NULL AND cm.remaining_count > 0)
      OR
      -- 금액이 남아있거나
      (cm.remaining_amount IS NOT NULL AND cm.remaining_amount > 0)
      OR
      -- 기간제인 경우
      (mp.membership_type = 'TIME_BASED')
    )
    AND (
      -- 서비스 ID가 없으면 전체 조회
      p_service_id IS NULL
      OR
      -- 전체 서비스 적용
      mp.all_services = true
      OR
      -- 특정 서비스 포함
      p_service_id = ANY(mp.applicable_service_ids)
    )
  ORDER BY cm.expires_at ASC NULLS LAST
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION check_deposit_exempt_by_membership IS '고객의 정액권으로 예약금 면제 가능 여부 확인';

-- ============================================
-- 8. 정액권 사용 함수
-- ============================================
CREATE OR REPLACE FUNCTION use_membership(
  p_membership_id UUID,
  p_booking_id UUID,
  p_service_id UUID,
  p_count_to_use INTEGER DEFAULT 1,
  p_amount_to_use DECIMAL DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL
)
RETURNS UUID  -- 사용 내역 ID 반환
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membership RECORD;
  v_usage_id UUID;
  v_new_remaining_count INTEGER;
  v_new_remaining_amount DECIMAL;
BEGIN
  -- 정액권 정보 조회 (락)
  SELECT * INTO v_membership
  FROM customer_memberships
  WHERE id = p_membership_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found: %', p_membership_id;
  END IF;

  IF v_membership.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Membership is not active: %', v_membership.status;
  END IF;

  -- 만료 확인
  IF v_membership.expires_at IS NOT NULL AND v_membership.expires_at < NOW() THEN
    -- 만료 상태로 변경
    UPDATE customer_memberships
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE id = p_membership_id;

    RAISE EXCEPTION 'Membership has expired';
  END IF;

  -- 첫 사용 시 활성화 (FIRST_USE 타입인 경우)
  IF v_membership.starts_at IS NULL AND v_membership.activation_type = 'FIRST_USE' THEN
    UPDATE customer_memberships
    SET
      starts_at = NOW(),
      expires_at = CASE
        WHEN (SELECT validity_days FROM membership_plans WHERE id = v_membership.plan_id) IS NOT NULL
        THEN NOW() + ((SELECT validity_days FROM membership_plans WHERE id = v_membership.plan_id) || ' days')::INTERVAL
        ELSE expires_at
      END,
      updated_at = NOW()
    WHERE id = p_membership_id
    RETURNING * INTO v_membership;
  END IF;

  -- 횟수 차감
  IF p_count_to_use IS NOT NULL AND p_count_to_use > 0 THEN
    IF v_membership.remaining_count IS NULL OR v_membership.remaining_count < p_count_to_use THEN
      RAISE EXCEPTION 'Insufficient remaining count: % < %', v_membership.remaining_count, p_count_to_use;
    END IF;
    v_new_remaining_count := v_membership.remaining_count - p_count_to_use;
  ELSE
    v_new_remaining_count := v_membership.remaining_count;
  END IF;

  -- 금액 차감
  IF p_amount_to_use IS NOT NULL AND p_amount_to_use > 0 THEN
    IF v_membership.remaining_amount IS NULL OR v_membership.remaining_amount < p_amount_to_use THEN
      RAISE EXCEPTION 'Insufficient remaining amount: % < %', v_membership.remaining_amount, p_amount_to_use;
    END IF;
    v_new_remaining_amount := v_membership.remaining_amount - p_amount_to_use;
  ELSE
    v_new_remaining_amount := v_membership.remaining_amount;
  END IF;

  -- 사용 내역 생성
  INSERT INTO membership_usages (
    membership_id, booking_id, service_id,
    count_used, amount_used,
    remaining_count_after, remaining_amount_after,
    processed_by
  )
  VALUES (
    p_membership_id, p_booking_id, p_service_id,
    p_count_to_use, p_amount_to_use,
    v_new_remaining_count, v_new_remaining_amount,
    p_processed_by
  )
  RETURNING id INTO v_usage_id;

  -- 정액권 잔여 업데이트
  UPDATE customer_memberships
  SET
    remaining_count = v_new_remaining_count,
    remaining_amount = v_new_remaining_amount,
    used_count = used_count + COALESCE(p_count_to_use, 0),
    used_amount = used_amount + COALESCE(p_amount_to_use, 0),
    status = CASE
      WHEN v_new_remaining_count = 0 AND v_new_remaining_amount IS NULL THEN 'EXHAUSTED'
      WHEN v_new_remaining_count IS NULL AND v_new_remaining_amount = 0 THEN 'EXHAUSTED'
      WHEN v_new_remaining_count = 0 AND v_new_remaining_amount = 0 THEN 'EXHAUSTED'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_membership_id;

  -- 예약에 정액권 정보 연결
  IF p_booking_id IS NOT NULL THEN
    UPDATE bookings
    SET
      membership_id = p_membership_id,
      membership_usage_id = v_usage_id,
      deposit_exempt_by_membership = true,
      updated_at = NOW()
    WHERE id = p_booking_id;
  END IF;

  RETURN v_usage_id;
END;
$$;

COMMENT ON FUNCTION use_membership IS '정액권 사용 처리 (횟수/금액 차감)';

-- ============================================
-- 9. 정액권 사용 취소 함수
-- ============================================
CREATE OR REPLACE FUNCTION cancel_membership_usage(
  p_usage_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_cancelled_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage RECORD;
BEGIN
  -- 사용 내역 조회
  SELECT * INTO v_usage
  FROM membership_usages
  WHERE id = p_usage_id AND is_cancelled = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- 사용 내역 취소 처리
  UPDATE membership_usages
  SET
    is_cancelled = true,
    cancelled_at = NOW(),
    cancel_reason = p_reason,
    cancelled_by = p_cancelled_by
  WHERE id = p_usage_id;

  -- 정액권 잔여 복원
  UPDATE customer_memberships
  SET
    remaining_count = remaining_count + COALESCE(v_usage.count_used, 0),
    remaining_amount = remaining_amount + COALESCE(v_usage.amount_used, 0),
    used_count = used_count - COALESCE(v_usage.count_used, 0),
    used_amount = used_amount - COALESCE(v_usage.amount_used, 0),
    status = CASE
      WHEN status = 'EXHAUSTED' THEN 'ACTIVE'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = v_usage.membership_id;

  -- 예약에서 정액권 정보 제거
  IF v_usage.booking_id IS NOT NULL THEN
    UPDATE bookings
    SET
      membership_id = NULL,
      membership_usage_id = NULL,
      deposit_exempt_by_membership = false,
      updated_at = NOW()
    WHERE id = v_usage.booking_id;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION cancel_membership_usage IS '정액권 사용 취소 및 잔여 복원';

-- ============================================
-- 10. RLS Policies
-- ============================================

-- membership_plans RLS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active membership plans"
  ON membership_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Salon admins can manage membership plans"
  ON membership_plans FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- customer_memberships RLS
ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own memberships"
  ON customer_memberships FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Salon staff can view customer memberships"
  ON customer_memberships FOR SELECT
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon staff can manage customer memberships"
  ON customer_memberships FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')
  );

-- membership_usages RLS
ALTER TABLE membership_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own usage history"
  ON membership_usages FOR SELECT
  USING (
    membership_id IN (
      SELECT cm.id FROM customer_memberships cm
      JOIN customers c ON c.id = cm.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Salon staff can view usage history"
  ON membership_usages FOR SELECT
  USING (
    membership_id IN (
      SELECT id FROM customer_memberships WHERE salon_id = get_my_salon_id()
    )
  );

CREATE POLICY "Salon staff can create usage records"
  ON membership_usages FOR INSERT
  WITH CHECK (
    membership_id IN (
      SELECT id FROM customer_memberships WHERE salon_id = get_my_salon_id()
    )
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')
  );

-- ============================================
-- 11. Triggers
-- ============================================

-- membership_plans updated_at
CREATE TRIGGER update_membership_plans_updated_at
BEFORE UPDATE ON membership_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- customer_memberships updated_at
CREATE TRIGGER update_customer_memberships_updated_at
BEFORE UPDATE ON customer_memberships
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 12. 만료 정액권 자동 상태 변경 함수
-- ============================================
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE customer_memberships
  SET
    status = 'EXPIRED',
    updated_at = NOW()
  WHERE status = 'ACTIVE'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION expire_memberships IS '만료된 정액권 상태 일괄 변경 (cron job용)';

