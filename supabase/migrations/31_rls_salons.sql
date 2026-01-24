-- ============================================
-- Row Level Security - Salons
-- ============================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active salons
CREATE POLICY "Anyone can view active salons"
  ON salons FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

-- Super admins can manage all salons
CREATE POLICY "Super admins can manage all salons"
  ON salons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Admins can update their own salon
CREATE POLICY "Admins can update their own salon"
  ON salons FOR UPDATE
  USING (
    id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );
