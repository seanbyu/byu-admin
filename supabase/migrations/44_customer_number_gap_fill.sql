-- ============================================
-- Customer Number: gap-filling 방식으로 함수 교체
-- 삭제된 고객번호가 생기면 가장 작은 빈 번호부터 채운다
-- ============================================

CREATE OR REPLACE FUNCTION get_next_customer_number(p_salon_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  candidate INTEGER := 1;
BEGIN
  -- 1부터 순차적으로 사용되지 않은 번호를 찾는다
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM customers
      WHERE salon_id = p_salon_id
        AND customer_number = candidate::TEXT
    );
    candidate := candidate + 1;
  END LOOP;

  RETURN candidate::TEXT;
END;
$$;

COMMENT ON FUNCTION get_next_customer_number IS '살롱의 다음 고객번호를 반환 (빈 번호 gap-filling 방식)';
