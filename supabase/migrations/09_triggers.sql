-- ============================================
-- Triggers
-- ============================================

-- ============================================
-- Updated_at Triggers
-- ============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_positions_updated_at BEFORE UPDATE ON staff_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
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

-- ============================================
-- Customer Stats Triggers
-- ============================================

-- Update customer no_show_count
CREATE OR REPLACE FUNCTION update_customer_no_show_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Increment on status change to NO_SHOW
  IF NEW.status = 'NO_SHOW' AND (OLD.status IS NULL OR OLD.status != 'NO_SHOW') THEN
    UPDATE customers
    SET no_show_count = no_show_count + 1
    WHERE id = NEW.customer_id;
  END IF;

  -- Decrement on status change from NO_SHOW
  IF OLD.status = 'NO_SHOW' AND NEW.status != 'NO_SHOW' THEN
    UPDATE customers
    SET no_show_count = GREATEST(0, no_show_count - 1)
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_no_show_count
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_no_show_count();

-- Update customer total_spent (on payment status change)
CREATE OR REPLACE FUNCTION update_customer_total_spent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add to total on PAID
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
    UPDATE customers
    SET total_spent = total_spent + NEW.total_price
    WHERE id = NEW.customer_id;
  END IF;

  -- Subtract on REFUND
  IF NEW.payment_status = 'REFUNDED' AND OLD.payment_status = 'PAID' THEN
    UPDATE customers
    SET total_spent = GREATEST(0, total_spent - OLD.total_price)
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_total_spent
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_total_spent();

-- Handle already-paid bookings on insert
CREATE OR REPLACE FUNCTION update_customer_total_spent_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'PAID' THEN
    UPDATE customers
    SET total_spent = total_spent + NEW.total_price
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_total_spent_insert
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_total_spent_on_insert();

-- Update customer last_visit and total_visits (on booking completion)
CREATE OR REPLACE FUNCTION update_customer_last_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    UPDATE customers
    SET
      last_visit = NEW.booking_date,
      total_visits = total_visits + 1,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_last_visit
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_last_visit();

-- ============================================
-- Auth User Creation Trigger
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

  v_is_approved := COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, true);
  v_is_owner := COALESCE((NEW.raw_user_meta_data->>'is_owner')::boolean, false);

  -- Insert into users table
  INSERT INTO users (id, user_type, role, email, name, phone, auth_provider, provider_user_id, line_profile)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER')::user_type,
    COALESCE(NEW.raw_user_meta_data->>'role',
      CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'SALON' THEN 'ADMIN'
        ELSE 'CUSTOMER'
      END
    )::user_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'EMAIL')::auth_provider,
    NEW.raw_user_meta_data->>'provider_user_id',
    CASE
      WHEN NEW.raw_user_meta_data->>'auth_provider' = 'LINE' THEN
        jsonb_build_object(
          'displayName', NEW.raw_user_meta_data->>'line_display_name',
          'pictureUrl', NEW.raw_user_meta_data->>'line_picture_url',
          'statusMessage', NEW.raw_user_meta_data->>'line_status_message'
        )
      ELSE NULL
    END
  );

  -- Create staff profile for admin users
  IF (COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'SALON') THEN
    v_permissions := COALESCE((NEW.raw_user_meta_data->>'permissions')::jsonb, NULL);

    -- Get salon's business_hours for work_schedule
    IF v_salon_id IS NOT NULL THEN
      SELECT business_hours INTO v_business_hours FROM salons WHERE id = v_salon_id;
      IF v_business_hours IS NOT NULL THEN
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

    INSERT INTO staff_profiles (user_id, salon_id, is_owner, is_approved, approved_by, approved_at, permissions, work_schedule)
    VALUES (
      NEW.id,
      v_salon_id,
      v_is_owner,
      v_is_approved,
      CASE WHEN v_is_approved = true THEN NEW.id ELSE NULL END,
      CASE WHEN v_is_approved = true THEN NOW() ELSE NULL END,
      COALESCE(v_permissions, '{}'::jsonb),
      v_work_schedule
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
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

COMMENT ON FUNCTION handle_new_auth_user() IS 'Auto-creates user and profile records when auth.users is created';
