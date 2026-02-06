-- ============================================
-- Customers Extended Fields (고객 정보 확장)
-- ============================================

-- ============================================
-- 1. 생년월일 추가
-- ============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN customers.birth_date IS '생년월일';

-- 생년월일 인덱스 (생일 마케팅용)
CREATE INDEX IF NOT EXISTS idx_customers_birth_date
ON customers(EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date));

-- ============================================
-- 2. 성별 추가
-- ============================================
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS gender gender_type DEFAULT 'unknown';

COMMENT ON COLUMN customers.gender IS '성별 (male/female/other/unknown)';

-- ============================================
-- 3. 직업 추가
-- ============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS occupation TEXT;

COMMENT ON COLUMN customers.occupation IS '직업';

-- ============================================
-- 4. 고객 그룹/태그 추가
-- ============================================
-- 고객 태그 ENUM
DO $$ BEGIN
  CREATE TYPE customer_tag AS ENUM (
    'VIP',           -- VIP 고객
    'REGULAR',       -- 단골
    'NEW',           -- 신규
    'RETURNING',     -- 재방문
    'DORMANT',       -- 휴면 (장기 미방문)
    'CHURNED',       -- 이탈
    'POTENTIAL_VIP'  -- VIP 후보
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS tags customer_tag[] DEFAULT '{}';

COMMENT ON COLUMN customers.tags IS '고객 태그/그룹 (VIP, REGULAR, NEW 등)';

-- 태그 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING gin(tags);

-- ============================================
-- 5. 블랙리스트 추가
-- ============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS blacklisted_by UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN customers.is_blacklisted IS '블랙리스트 여부';
COMMENT ON COLUMN customers.blacklist_reason IS '블랙리스트 사유';
COMMENT ON COLUMN customers.blacklisted_at IS '블랙리스트 등록 시간';
COMMENT ON COLUMN customers.blacklisted_by IS '블랙리스트 등록한 스태프';

-- 블랙리스트 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_blacklisted
ON customers(salon_id) WHERE is_blacklisted = true;

-- ============================================
-- 6. 추가 연락처 정보
-- ============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN customers.secondary_phone IS '보조 연락처';
COMMENT ON COLUMN customers.address IS '주소';

-- ============================================
-- 7. 고객 등급 (자동 계산용)
-- ============================================
DO $$ BEGIN
  CREATE TYPE customer_grade AS ENUM (
    'BRONZE',    -- 기본
    'SILVER',    -- 실버
    'GOLD',      -- 골드
    'PLATINUM',  -- 플래티넘
    'DIAMOND'    -- 다이아몬드
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS grade customer_grade DEFAULT 'BRONZE';

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS grade_updated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN customers.grade IS '고객 등급 (방문/매출 기반)';
COMMENT ON COLUMN customers.grade_updated_at IS '등급 마지막 업데이트 시간';

-- ============================================
-- 8. 메모 확장 (내부/외부 메모 분리)
-- ============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

COMMENT ON COLUMN customers.notes IS '고객 요청사항 (고객에게 공개 가능)';
COMMENT ON COLUMN customers.internal_notes IS '내부 메모 (스태프만 열람)';

-- ============================================
-- 9. 고객 그룹 테이블 (살롱별 커스텀 그룹)
-- ============================================

-- 그룹 타입 ENUM
DO $$ BEGIN
  CREATE TYPE group_type AS ENUM (
    'MANUAL',     -- 수동 할당만
    'AUTO',       -- 자동 할당만
    'HYBRID'      -- 자동 + 수동
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- 기본 정보
  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(50),
  name_th VARCHAR(50),

  color VARCHAR(7) DEFAULT '#6B7280',  -- HEX 색상코드
  icon VARCHAR(50),  -- 아이콘 이름 (예: 'crown', 'star', 'heart')
  description TEXT,

  -- 그룹 타입
  group_type group_type NOT NULL DEFAULT 'MANUAL',

  -- ============================================
  -- 자동 분류 규칙 (JSONB)
  -- ============================================
  auto_assign_rules JSONB DEFAULT NULL,
  --
  -- 규칙 구조 예시:
  -- {
  --   "operator": "AND",  // "AND" 또는 "OR"
  --   "conditions": [
  --     {
  --       "field": "total_spent",
  --       "operator": ">=",
  --       "value": 200000
  --     },
  --     {
  --       "field": "total_visits",
  --       "operator": ">=",
  --       "value": 5
  --     }
  --   ]
  -- }
  --
  -- 지원하는 필드 (field):
  --   - total_spent: 총 매출액
  --   - total_visits: 총 방문 횟수
  --   - no_show_count: 노쇼 횟수
  --   - days_since_registration: 가입 후 경과일
  --   - days_since_last_visit: 마지막 방문 후 경과일
  --   - grade: 고객 등급
  --
  -- 지원하는 연산자 (operator):
  --   - ">=", ">", "<=", "<", "==", "!="
  --
  -- ============================================
  -- 실제 사용 예시:
  -- ============================================
  --
  -- 1. VIP 고객 (매출 20만 이상 AND 방문 5회 이상):
  -- {
  --   "operator": "AND",
  --   "conditions": [
  --     {"field": "total_spent", "operator": ">=", "value": 200000},
  --     {"field": "total_visits", "operator": ">=", "value": 5}
  --   ]
  -- }
  --
  -- 2. 신규 고객 (가입 30일 이내):
  -- {
  --   "operator": "AND",
  --   "conditions": [
  --     {"field": "days_since_registration", "operator": "<=", "value": 30}
  --   ]
  -- }
  --
  -- 3. 휴면 고객 (90일 이상 미방문):
  -- {
  --   "operator": "AND",
  --   "conditions": [
  --     {"field": "days_since_last_visit", "operator": ">=", "value": 90}
  --   ]
  -- }
  --
  -- 4. 단골 고객 (방문 10회 이상 OR 매출 50만 이상):
  -- {
  --   "operator": "OR",
  --   "conditions": [
  --     {"field": "total_visits", "operator": ">=", "value": 10},
  --     {"field": "total_spent", "operator": ">=", "value": 500000}
  --   ]
  -- }
  --
  -- 5. 노쇼 주의 고객 (노쇼 2회 이상):
  -- {
  --   "operator": "AND",
  --   "conditions": [
  --     {"field": "no_show_count", "operator": ">=", "value": 2}
  --   ]
  -- }

  -- 자동 분류 실행 설정
  auto_assign_enabled BOOLEAN NOT NULL DEFAULT false,
  last_auto_assigned_at TIMESTAMP WITH TIME ZONE,

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, name)
);

CREATE INDEX idx_customer_groups_salon ON customer_groups(salon_id) WHERE is_active = true;

COMMENT ON TABLE customer_groups IS '살롱별 커스텀 고객 그룹';

-- ============================================
-- 10. 고객-그룹 연결 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS customer_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,

  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE(customer_id, group_id)
);

CREATE INDEX idx_customer_group_members_customer ON customer_group_members(customer_id);
CREATE INDEX idx_customer_group_members_group ON customer_group_members(group_id);

COMMENT ON TABLE customer_group_members IS '고객-그룹 연결 (다대다)';

-- ============================================
-- 11. RLS Policies
-- ============================================

-- Customer Groups
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their customer groups"
  ON customer_groups FOR SELECT
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon managers can manage customer groups"
  ON customer_groups FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- Customer Group Members
ALTER TABLE customer_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view customer group members"
  ON customer_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_group_members.customer_id
      AND c.salon_id = get_my_salon_id()
    )
  );

CREATE POLICY "Salon staff can manage customer group members"
  ON customer_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_group_members.customer_id
      AND c.salon_id = get_my_salon_id()
    )
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

-- ============================================
-- 12. Triggers
-- ============================================

-- customer_groups updated_at
CREATE TRIGGER update_customer_groups_updated_at
BEFORE UPDATE ON customer_groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
