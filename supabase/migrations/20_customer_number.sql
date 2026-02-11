-- ============================================
-- Customer Number Field (고객번호 필드 추가)
-- ============================================

-- 고객번호 컬럼 추가
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(20);

-- 고객번호 인덱스 (살롱별 고유)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_salon_number
ON customers(salon_id, customer_number) WHERE customer_number IS NOT NULL;

COMMENT ON COLUMN customers.customer_number IS '고객번호 (살롱별 고유)';

-- ============================================
-- Helper function: 다음 고객번호 가져오기
-- ============================================
CREATE OR REPLACE FUNCTION get_next_customer_number(p_salon_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_number INTEGER;
BEGIN
  -- 현재 최대 고객번호 조회 (숫자로 변환 가능한 것만)
  SELECT COALESCE(MAX(customer_number::INTEGER), 0)
  INTO max_number
  FROM customers
  WHERE salon_id = p_salon_id
    AND customer_number ~ '^\d+$';

  RETURN (max_number + 1)::TEXT;
END;
$$;

COMMENT ON FUNCTION get_next_customer_number IS '살롱의 다음 고객번호를 반환';
