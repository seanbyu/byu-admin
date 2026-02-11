-- ============================================
-- Customer Filters Table
-- 고객 필터 커스터마이징 기능
-- ============================================

-- 고객 필터 테이블 생성
CREATE TABLE IF NOT EXISTS customer_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- 필터 식별
  filter_key TEXT NOT NULL,
  is_system_filter BOOLEAN NOT NULL DEFAULT false,

  -- 다국어 라벨
  label TEXT NOT NULL,
  label_en TEXT,
  label_th TEXT,

  -- 필터 조건 (JSONB)
  -- 예: [{"field": "total_visits", "operator": ">=", "value": 5}]
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 조건 결합 로직
  condition_logic TEXT NOT NULL DEFAULT 'AND',

  -- 표시 설정
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 제약 조건
  UNIQUE(salon_id, filter_key)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_customer_filters_salon ON customer_filters(salon_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customer_filters_order ON customer_filters(salon_id, display_order);

-- 코멘트
COMMENT ON TABLE customer_filters IS '살롱별 커스텀 고객 필터 설정';
COMMENT ON COLUMN customer_filters.is_system_filter IS '시스템 필터는 삭제 불가 (all, new, returning, regular, dormant, vip)';
COMMENT ON COLUMN customer_filters.conditions IS '필터 조건 배열 (JSONB)';
COMMENT ON COLUMN customer_filters.condition_logic IS '조건 결합 방식 (AND 또는 OR)';

-- ============================================
-- 기본 필터 시드 함수
-- ============================================

CREATE OR REPLACE FUNCTION seed_default_customer_filters(p_salon_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO customer_filters (salon_id, filter_key, is_system_filter, label, label_en, label_th, conditions, display_order)
  VALUES
    -- 전체 (조건 없음)
    (p_salon_id, 'all', true, '전체', 'All', 'ทั้งหมด', '[]'::jsonb, 0),

    -- 신규: total_visits == 0
    (p_salon_id, 'new', true, '신규', 'New', 'ใหม่',
     '[{"field": "total_visits", "operator": "==", "value": 0}]'::jsonb, 1),

    -- 재방문: 0 < total_visits < 5
    (p_salon_id, 'returning', true, '재방문', 'Returning', 'กลับมา',
     '[{"field": "total_visits", "operator": ">", "value": 0}, {"field": "total_visits", "operator": "<", "value": 5}]'::jsonb, 2),

    -- 단골: total_visits >= 5
    (p_salon_id, 'regular', true, '단골', 'Regular', 'ประจำ',
     '[{"field": "total_visits", "operator": ">=", "value": 5}]'::jsonb, 3),

    -- 휴면: days_since_last_visit > 30
    (p_salon_id, 'dormant', true, '휴면', 'Dormant', 'พักตัว',
     '[{"field": "days_since_last_visit", "operator": ">", "value": 30}]'::jsonb, 4),

    -- VIP: total_spent >= 100000
    (p_salon_id, 'vip', true, 'VIP', 'VIP', 'VIP',
     '[{"field": "total_spent", "operator": ">=", "value": 100000}]'::jsonb, 5)
  ON CONFLICT (salon_id, filter_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 기존 살롱에 기본 필터 시드
-- ============================================

DO $$
DECLARE
  salon_record RECORD;
BEGIN
  FOR salon_record IN SELECT id FROM salons LOOP
    PERFORM seed_default_customer_filters(salon_record.id);
  END LOOP;
END $$;

-- ============================================
-- 새 살롱 생성 시 자동 시드 트리거
-- ============================================

CREATE OR REPLACE FUNCTION trigger_seed_customer_filters()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_customer_filters(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS after_salon_insert_seed_customer_filters ON salons;

CREATE TRIGGER after_salon_insert_seed_customer_filters
AFTER INSERT ON salons
FOR EACH ROW
EXECUTE FUNCTION trigger_seed_customer_filters();

-- ============================================
-- updated_at 자동 업데이트 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_customer_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_filters_updated_at ON customer_filters;

CREATE TRIGGER customer_filters_updated_at
BEFORE UPDATE ON customer_filters
FOR EACH ROW
EXECUTE FUNCTION update_customer_filters_updated_at();
