-- ============================================
-- Helper Functions
-- ============================================

-- ============================================
-- Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Helper Functions (SECURITY DEFINER to avoid recursion)
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's salon_id (via staff_profiles)
CREATE OR REPLACE FUNCTION get_my_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM staff_profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Customer Matching Functions (for LINE login)
-- ============================================

-- Find customer by phone number (normalized)
CREATE OR REPLACE FUNCTION find_customer_by_phone(
  p_salon_id UUID,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Normalize phone number (remove non-numeric except +)
  p_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  SELECT id INTO v_customer_id
  FROM customers
  WHERE salon_id = p_salon_id
    AND regexp_replace(phone, '[^0-9+]', '', 'g') = p_phone
  LIMIT 1;

  RETURN v_customer_id;
END;
$$;

COMMENT ON FUNCTION find_customer_by_phone IS 'Find customer by normalized phone number';

-- Link LINE user to existing customer or create new
CREATE OR REPLACE FUNCTION link_line_user_to_customer(
  p_user_id UUID,
  p_salon_id UUID,
  p_phone TEXT,
  p_name TEXT DEFAULT NULL,
  p_acquisition_meta JSONB DEFAULT '{}'
)
RETURNS TABLE (
  customer_id UUID,
  is_new_customer BOOLEAN,
  customer_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_is_new BOOLEAN := false;
  v_customer_name TEXT;
BEGIN
  -- 1. Try to find existing customer by phone
  v_customer_id := find_customer_by_phone(p_salon_id, p_phone);

  IF v_customer_id IS NOT NULL THEN
    -- 2a. Link existing customer
    UPDATE customers
    SET
      user_id = p_user_id,
      acquisition_meta = COALESCE(acquisition_meta, '{}'::jsonb) || p_acquisition_meta,
      updated_at = NOW()
    WHERE id = v_customer_id
    RETURNING name INTO v_customer_name;

    -- Update users.customer_id for reverse lookup
    UPDATE users
    SET customer_id = v_customer_id
    WHERE id = p_user_id;

  ELSE
    -- 2b. Create new customer
    INSERT INTO customers (
      salon_id,
      user_id,
      name,
      phone,
      acquisition_meta
    )
    VALUES (
      p_salon_id,
      p_user_id,
      COALESCE(p_name, 'LINE User'),
      p_phone,
      p_acquisition_meta || '{"registered_via": "line_login"}'::jsonb
    )
    RETURNING id, name INTO v_customer_id, v_customer_name;

    v_is_new := true;

    -- Update users.customer_id
    UPDATE users
    SET customer_id = v_customer_id
    WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_customer_id, v_is_new, v_customer_name;
END;
$$;

COMMENT ON FUNCTION link_line_user_to_customer IS 'Link LINE user to existing customer by phone, or create new customer';
