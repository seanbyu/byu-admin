-- ============================================
-- bookings 테이블에 sales_registered 전용 컬럼 추가
-- 기존: booking_meta->>'sales_registered' = 'true' (JSONB - 느림)
-- 개선: sales_registered BOOLEAN (전용 컬럼 - 빠름)
-- ============================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS sales_registered BOOLEAN NOT NULL DEFAULT false;

-- 기존 JSONB 데이터에서 backfill
UPDATE bookings
SET sales_registered = true
WHERE booking_meta->>'sales_registered' = 'true'
  AND sales_registered = false;

-- 매출 조회 전용 복합 인덱스 (salon_id + 날짜 범위 + sales_registered)
CREATE INDEX IF NOT EXISTS idx_bookings_sales
  ON bookings(salon_id, booking_date DESC)
  WHERE sales_registered = true;

COMMENT ON COLUMN bookings.sales_registered IS '매출 등록 여부 (booking_meta.sales_registered와 동기화)';

-- product_name 컬럼도 UpdateBookingDto에 반영
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS product_name TEXT;

COMMENT ON COLUMN bookings.product_name IS '판매된 제품명 요약';
