-- ============================================
-- Salon Products (Retail) & Booking Product Fields
-- ============================================

-- ============================================
-- salon_products: 매장 판매 제품 (소매 제품)
-- ============================================
CREATE TABLE salon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- 제품 정보
  name TEXT NOT NULL,
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  -- 가격
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- 재고
  stock_quantity INTEGER,

  -- 표시 설정
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salon_products_salon ON salon_products(salon_id);
CREATE INDEX idx_salon_products_active ON salon_products(salon_id, is_active);

COMMENT ON TABLE salon_products IS '매장 판매 소매 제품 목록';
COMMENT ON COLUMN salon_products.price IS '판매 가격';
COMMENT ON COLUMN salon_products.stock_quantity IS '재고 수량 (NULL이면 관리 안함)';

-- ============================================
-- bookings 테이블에 제품 관련 필드 추가
-- ============================================

-- 시술에 사용된 제품 (제품금액)
ALTER TABLE bookings
  ADD COLUMN product_id UUID REFERENCES salon_products(id) ON DELETE SET NULL,
  ADD COLUMN product_amount DECIMAL(10, 2) DEFAULT 0,
  -- 점포 판매: 시술과 별도로 매장에서 제품을 판매한 금액
  ADD COLUMN store_sales_amount DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN bookings.product_id IS '시술에 사용된 제품 ID';
COMMENT ON COLUMN bookings.product_amount IS '제품금액 (시술 사용 제품 비용)';
COMMENT ON COLUMN bookings.store_sales_amount IS '점포 판매금액 (별도 소매 판매)';

-- ============================================
-- RLS Policies for salon_products
-- ============================================
ALTER TABLE salon_products ENABLE ROW LEVEL SECURITY;

-- 같은 살롱 유저 조회 허용
CREATE POLICY "salon_products_select" ON salon_products
  FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id FROM users WHERE id = auth.uid()
    )
  );

-- 오너/매니저만 수정 가능
CREATE POLICY "salon_products_insert" ON salon_products
  FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "salon_products_update" ON salon_products
  FOR UPDATE
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "salon_products_delete" ON salon_products
  FOR DELETE
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- updated_at 트리거 (salon_products)
-- ============================================
CREATE TRIGGER update_salon_products_updated_at
  BEFORE UPDATE ON salon_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
