-- Fix auth_provider enum
ALTER TYPE auth_provider ADD VALUE IF NOT EXISTS 'PHONE';

-- Make email nullable in users table (Phone auth user won't have email initially)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Make name nullable (Phone auth user might not have name initially)
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Update handle_new_user to support Phone Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_salon_id UUID;
  v_permissions JSONB;
  v_user_type user_type;
  v_role user_role;
  v_name TEXT;
  v_phone TEXT;
  v_provider auth_provider;
BEGIN
  -- Extract salon_id
  IF (NEW.raw_user_meta_data->>'salon_id' IS NOT NULL) THEN
    v_salon_id := (NEW.raw_user_meta_data->>'salon_id')::UUID;
  END IF;

  -- Determine user_type (default CUSTOMER)
  BEGIN
    v_user_type := COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'CUSTOMER');
  EXCEPTION WHEN OTHERS THEN
    v_user_type := 'CUSTOMER';
  END;

  -- Determine role
  IF (NEW.raw_user_meta_data->>'role' IS NOT NULL) THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
      IF v_user_type = 'ADMIN_USER' THEN v_role := 'ADMIN'; ELSE v_role := 'CUSTOMER'; END IF;
    END;
  ELSE
    IF v_user_type = 'ADMIN_USER' THEN
      v_role := 'ADMIN';
    ELSE
      v_role := 'CUSTOMER';
    END IF;
  END IF;

  -- Determine phone (priority: metadata -> auth.users column)
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone);

  -- Determine provider
  IF v_phone IS NOT NULL AND NEW.email IS NULL THEN
    v_provider := 'PHONE';
  ELSE
    -- Default to EMAIL if not specified, but try to parse from metadata
    BEGIN
      v_provider := COALESCE((NEW.raw_user_meta_data->>'auth_provider')::auth_provider, 'EMAIL');
    EXCEPTION WHEN OTHERS THEN
      v_provider := 'EMAIL';
    END;
  END IF;
  
  -- Determine name (priority: metadata -> email part -> phone -> 'Unknown')
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  IF v_name = '' AND NEW.email IS NOT NULL THEN
    v_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  IF v_name = '' OR v_name IS NULL THEN
    v_name := COALESCE(v_phone, 'Unknown User');
  END IF;


  INSERT INTO users (id, user_type, role, email, name, phone, auth_provider, provider_user_id, is_approved, salon_id, approved_by, approved_at)
  VALUES (
    NEW.id,
    v_user_type,
    v_role,
    NEW.email, -- Can be null now
    v_name,
    v_phone,
    v_provider,
    NEW.raw_user_meta_data->>'provider_user_id',
    -- is_approved
    COALESCE(
      (NEW.raw_user_meta_data->>'is_approved')::boolean,
      CASE
        WHEN v_user_type = 'CUSTOMER' THEN true
        ELSE false
      END
    ),
    v_salon_id,
    CASE WHEN (NEW.raw_user_meta_data->>'is_approved')::boolean = true THEN NEW.id ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'is_approved')::boolean = true THEN NOW() ELSE NULL END
  );

  -- Create profile based on user type
  IF (v_user_type = 'CUSTOMER') THEN
    INSERT INTO customer_profiles (user_id, line_user_id, line_display_name, line_picture_url)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'line_user_id',
      NEW.raw_user_meta_data->>'line_display_name',
      NEW.raw_user_meta_data->>'line_picture_url'
    );
  ELSIF (v_user_type = 'ADMIN_USER') THEN
    v_permissions := COALESCE((NEW.raw_user_meta_data->>'permissions')::jsonb, NULL);
    
    INSERT INTO staff_profiles (user_id, permissions)
    VALUES (
      NEW.id,
      COALESCE(v_permissions, '{
        "bookings": {"view": true, "create": true, "edit": true, "delete": false},
        "customers": {"view": true, "create": true, "edit": true, "delete": false},
        "services": {"view": true, "create": false, "edit": false, "delete": false},
        "staff": {"view": true, "create": false, "edit": false, "delete": false},
        "settings": {"view": false, "edit": false}
      }'::jsonb)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
