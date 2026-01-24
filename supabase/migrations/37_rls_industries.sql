-- ============================================
-- Row Level Security - Industries & Salon Industries
-- ============================================

-- 1. Industries (Public Read)
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industries are viewable by everyone"
  ON industries FOR SELECT
  USING (true);

-- 2. Salon Industries (Manageable by Salon Staff)
ALTER TABLE salon_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon industries viewable by everyone"
  ON salon_industries FOR SELECT
  USING (true);

CREATE POLICY "Salon admins can insert salon industries"
  ON salon_industries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        -- User belongs to the salon being modified
        (salon_id = salon_industries.salon_id AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN'))
      )
    )
  );

-- For strict security:
DROP POLICY IF EXISTS "Salon admins can manage salon industries" ON salon_industries;
CREATE POLICY "Salon admins can manage salon industries"
  ON salon_industries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND salon_id = salon_industries.salon_id
      AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );
