-- ============================================
-- Customer Name History & Phone Normalization
-- 고객 이름 변경 이력 추적 및 전화번호 정규화
-- ============================================

-- 1. 이름 변경 이력 테이블
CREATE TABLE customer_name_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  old_name VARCHAR(100) NOT NULL,
  new_name VARCHAR(100) NOT NULL,
  changed_by TEXT NOT NULL,         -- 'web_booking', 'admin', 'line_sync'
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_name_history_customer ON customer_name_history(customer_id);

COMMENT ON TABLE customer_name_history IS 'Audit log for customer name changes across web and admin systems';
COMMENT ON COLUMN customer_name_history.changed_by IS 'Source of name change: web_booking, admin, line_sync';

-- 2. 전화번호 정규화 컬럼 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20);

-- 기존 데이터 마이그레이션: phone에서 숫자와 + 만 추출
UPDATE customers
SET phone_normalized = regexp_replace(phone, '[^0-9+]', '', 'g')
WHERE phone IS NOT NULL AND phone != '';

-- 정규화 전화번호 인덱스 (salon_id + phone_normalized 복합)
CREATE INDEX idx_customers_phone_normalized
ON customers(salon_id, phone_normalized)
WHERE phone_normalized IS NOT NULL AND phone_normalized != '';

-- 3. phone INSERT/UPDATE 시 phone_normalized 자동 설정 트리거
CREATE OR REPLACE FUNCTION fn_normalize_customer_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_normalized := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
  ELSE
    NEW.phone_normalized := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_customer_phone
BEFORE INSERT OR UPDATE OF phone ON customers
FOR EACH ROW EXECUTE FUNCTION fn_normalize_customer_phone();

COMMENT ON COLUMN customers.phone_normalized IS 'Auto-populated by trigger: digits and + only, for consistent phone matching';
COMMENT ON FUNCTION fn_normalize_customer_phone IS 'Trigger function: strips non-digit/plus chars from phone to populate phone_normalized';

-- 4. RLS policies for customer_name_history
ALTER TABLE customer_name_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view name history"
ON customer_name_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    JOIN staff_profiles sp ON sp.salon_id = c.salon_id
    WHERE c.id = customer_name_history.customer_id
      AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert name history"
ON customer_name_history FOR INSERT
WITH CHECK (true);
