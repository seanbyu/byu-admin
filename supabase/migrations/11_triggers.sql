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
BEGIN
  -- Extract salon_id from metadata if present (for invites)
  IF (NEW.raw_user_meta_data->>'salon_id' IS NOT NULL) THEN
    v_salon_id := (NEW.raw_user_meta_data->>'salon_id')::UUID;
  END IF;

  INSERT INTO users (id, user_type, role, email, name, phone, auth_provider, provider_user_id, is_approved, salon_id, approved_by, approved_at)
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
    NEW.raw_user_meta_data->>'provider_user_id',
    -- is_approved: 메타데이터에 있으면 사용, 없으면 기본 true
    -- 살롱 승인(salons.approval_status)이 실제 승인 체크를 담당
    COALESCE(
      (NEW.raw_user_meta_data->>'is_approved')::boolean,
      true  -- 모든 사용자 기본 승인 (살롱 승인으로 제어)
    ),
    v_salon_id,
    CASE WHEN COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, true) = true THEN NEW.id ELSE NULL END,
    CASE WHEN COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, true) = true THEN NOW() ELSE NULL END
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

    INSERT INTO staff_profiles (user_id, permissions)
    VALUES (
      NEW.id,
      COALESCE(v_permissions, '{}'::jsonb)
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
COMMENT ON FUNCTION handle_new_auth_user() IS 'Creates user record when auth.users is created. All users default to is_approved=true. Salon approval (salons.approval_status) is the gating factor for salon owners.';
