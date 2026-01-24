-- ============================================
-- Row Level Security - Staff Positions
-- ============================================

ALTER TABLE staff_positions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active positions
CREATE POLICY "Anyone can view active positions"
  ON staff_positions FOR SELECT
  USING (is_active = true);

-- Salon admins can manage positions
CREATE POLICY "Salon admins can manage positions"
  ON staff_positions FOR ALL
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );
