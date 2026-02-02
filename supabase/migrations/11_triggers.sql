-- ============================================
-- Triggers
-- ============================================

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_positions_updated_at BEFORE UPDATE ON staff_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_position_prices_updated_at BEFORE UPDATE ON service_position_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update customer stats trigger
CREATE TRIGGER update_customer_stats_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- Auto-create user in users table when auth.users is created
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_salon_id UUID;
  v_permissions JSONB;
  v_is_approved BOOLEAN;
  v_is_owner BOOLEAN;
  v_work_schedule JSONB;
  v_business_hours JSONB;
BEGIN
  -- Extract salon_id from metadata if present (for invites)
  IF (NEW.raw_user_meta_data->>'salon_id' IS NOT NULL) THEN
    v_salon_id := (NEW.raw_user_meta_data->>'salon_id')::UUID;
  END IF;

  -- Extract is_approved from metadata, default to true
  v_is_approved := COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, true);

  -- Extract is_owner from metadata, default to false
  v_is_owner := COALESCE((NEW.raw_user_meta_data->>'is_owner')::boolean, false);

  -- Insert into users table (base info only, no salon_id)
  INSERT INTO users (id, user_type, role, email, name, phone, auth_provider, provider_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER')::user_type,
    COALESCE(NEW.raw_user_meta_data->>'role',
      CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'ADMIN_USER' THEN 'ADMIN'
        ELSE 'CUSTOMER'
      END
    )::user_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'EMAIL')::auth_provider,
    NEW.raw_user_meta_data->>'provider_user_id'
  );

  -- Create profile based on user type
  IF (COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'CUSTOMER') THEN
    INSERT INTO customer_profiles (user_id, line_user_id, line_display_name, line_picture_url)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'line_user_id',
      NEW.raw_user_meta_data->>'line_display_name',
      NEW.raw_user_meta_data->>'line_picture_url'
    );
  ELSIF (COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'ADMIN_USER') THEN
    -- Extract permissions from metadata if present
    v_permissions := COALESCE((NEW.raw_user_meta_data->>'permissions')::jsonb, NULL);

    -- Get salon's business_hours and convert to work_schedule format
    IF v_salon_id IS NOT NULL THEN
      SELECT business_hours INTO v_business_hours FROM salons WHERE id = v_salon_id;
      IF v_business_hours IS NOT NULL THEN
        -- Convert business_hours (open/close) to work_schedule (start/end) format
        v_work_schedule := jsonb_build_object(
          'monday', jsonb_build_object('enabled', COALESCE((v_business_hours->'monday'->>'enabled')::boolean, false), 'start', v_business_hours->'monday'->>'open', 'end', v_business_hours->'monday'->>'close'),
          'tuesday', jsonb_build_object('enabled', COALESCE((v_business_hours->'tuesday'->>'enabled')::boolean, true), 'start', v_business_hours->'tuesday'->>'open', 'end', v_business_hours->'tuesday'->>'close'),
          'wednesday', jsonb_build_object('enabled', COALESCE((v_business_hours->'wednesday'->>'enabled')::boolean, true), 'start', v_business_hours->'wednesday'->>'open', 'end', v_business_hours->'wednesday'->>'close'),
          'thursday', jsonb_build_object('enabled', COALESCE((v_business_hours->'thursday'->>'enabled')::boolean, true), 'start', v_business_hours->'thursday'->>'open', 'end', v_business_hours->'thursday'->>'close'),
          'friday', jsonb_build_object('enabled', COALESCE((v_business_hours->'friday'->>'enabled')::boolean, true), 'start', v_business_hours->'friday'->>'open', 'end', v_business_hours->'friday'->>'close'),
          'saturday', jsonb_build_object('enabled', COALESCE((v_business_hours->'saturday'->>'enabled')::boolean, true), 'start', v_business_hours->'saturday'->>'open', 'end', v_business_hours->'saturday'->>'close'),
          'sunday', jsonb_build_object('enabled', COALESCE((v_business_hours->'sunday'->>'enabled')::boolean, true), 'start', v_business_hours->'sunday'->>'open', 'end', v_business_hours->'sunday'->>'close')
        );
      END IF;
    END IF;

    -- Insert staff_profiles with salon_id, owner flag, approval info, and work_schedule
    INSERT INTO staff_profiles (user_id, salon_id, is_owner, is_approved, approved_by, approved_at, permissions, work_schedule)
    VALUES (
      NEW.id,
      v_salon_id,  -- salon_id is now in staff_profiles
      v_is_owner,  -- owner flag for salon representative
      v_is_approved,
      CASE WHEN v_is_approved = true THEN NEW.id ELSE NULL END,
      CASE WHEN v_is_approved = true THEN NOW() ELSE NULL END,
      COALESCE(v_permissions, '{}'::jsonb),
      v_work_schedule  -- work_schedule synced with salon's business_hours
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, skip
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_auth_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Comment
COMMENT ON FUNCTION handle_new_auth_user() IS 'Creates user record when auth.users is created. Staff-specific fields (salon_id, is_approved) are now stored in staff_profiles.';
