-- ============================================
-- Product Categories (제품 카테고리)
-- ============================================

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_categories_salon ON product_categories(salon_id);

COMMENT ON TABLE product_categories IS '매장 제품 카테고리';
COMMENT ON COLUMN product_categories.display_order IS '표시 순서';

-- ============================================
-- salon_products에 category_id 추가
-- ============================================

ALTER TABLE salon_products
  ADD COLUMN category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

CREATE INDEX idx_salon_products_category ON salon_products(category_id);

-- ============================================
-- RLS Policies for product_categories
-- ============================================
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_select" ON product_categories
  FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "product_categories_insert" ON product_categories
  FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "product_categories_update" ON product_categories
  FOR UPDATE
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "product_categories_delete" ON product_categories
  FOR DELETE
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid()
        AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- updated_at 트리거 (product_categories)
-- ============================================
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
