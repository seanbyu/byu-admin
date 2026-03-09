-- bookings 테이블에 product_name 컬럼 추가
-- product_amount, product_id는 24_booking_products.sql 에서 이미 추가됨

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS product_name TEXT;

COMMENT ON COLUMN bookings.product_name IS '판매된 제품명 요약 (복수인 경우 쉼표 구분)';
