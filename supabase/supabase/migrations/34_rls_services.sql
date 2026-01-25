-- ============================================
-- Row Level Security - Service Categories, Services & Service Position Prices
-- ============================================

-- Service Categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON service_categories FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Salon managers can manage their categories"
  ON service_categories FOR ALL
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );

-- Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Salon managers can manage their services"
  ON services FOR ALL
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );

-- Service Position Prices
ALTER TABLE service_position_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service prices"
  ON service_position_prices FOR SELECT
  USING (true);

CREATE POLICY "Salon managers can manage service prices"
  ON service_position_prices FOR ALL
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE salon_id IN (
        SELECT salon_id FROM users
        WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      )
    )
  );
