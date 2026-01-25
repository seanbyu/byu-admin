-- Helper Functions to bypass RLS recursion
-- These functions run with the privileges of the defining user (usually superuser/postgres)
-- preventing the infinite loop when RLS policies query the table itself.

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop existing recursive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view same salon users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can create users in their salon" ON users;

-- Re-create policies using helper functions

-- 1. Users can view their own profile (No change needed, but keeping consistency)
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 2. Super admins can view all users (Fixed recursion)
CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  USING (
    get_my_role() = 'SUPER_ADMIN'
  );

-- 3. Users can view same salon users (Fixed recursion)
CREATE POLICY "Users can view same salon users"
  ON users FOR SELECT
  USING (
    salon_id = get_my_salon_id()
  );

-- 4. Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 5. Admins can create users in their salon (Fixed recursion)
CREATE POLICY "Admins can create users in their salon"
  ON users FOR INSERT
  WITH CHECK (
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') AND
    (
      get_my_role() = 'SUPER_ADMIN' OR
      salon_id = get_my_salon_id()
    )
  );
