-- ============================================
-- Row Level Security - Users
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Super admins can view all users
CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Users can view same salon users
CREATE POLICY "Users can view same salon users"
  ON users FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can create users in their salon
CREATE POLICY "Admins can create users in their salon"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS auth_user
      WHERE auth_user.id = auth.uid()
      AND auth_user.user_type = 'ADMIN_USER'
      AND auth_user.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND (auth_user.salon_id = salon_id OR auth_user.role = 'SUPER_ADMIN')
    )
  );
