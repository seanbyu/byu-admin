-- ============================================
-- Row Level Security - Admin & Customer Profiles
-- ============================================

-- Staff Profiles
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff users can view their own profile"
  ON staff_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff users in same salon can view each other"
  ON staff_profiles FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE salon_id = (SELECT salon_id FROM users WHERE id = auth.uid())
    )
  );

-- Customer Profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can update their own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Salon staff can view customer profiles"
  ON customer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND user_type = 'ADMIN_USER'
    )
  );
