-- ============================================
-- Customers Table - Row Level Security
-- ============================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for customers table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Salon staff can update their customers" ON customers;
DROP POLICY IF EXISTS "Salon staff can delete their customers" ON customers;

-- 1. Anyone can view customers (for now - adjust based on requirements)
CREATE POLICY "Anyone can view customers"
  ON customers
  FOR SELECT
  USING (true);

-- 2. Authenticated users can insert customers
CREATE POLICY "Authenticated users can insert customers"
  ON customers
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Salon staff can update their salon's customers
CREATE POLICY "Salon staff can update their customers"
  ON customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND sp.salon_id = customers.salon_id
    )
  );

-- 4. Salon staff can delete their salon's customers
CREATE POLICY "Salon staff can delete their customers"
  ON customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND sp.salon_id = customers.salon_id
    )
  );
