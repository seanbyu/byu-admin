-- ============================================
-- Triggers and Functions
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_staff_positions_updated_at ON staff_positions;
CREATE TRIGGER update_staff_positions_updated_at BEFORE UPDATE ON staff_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_service_position_prices_updated_at ON service_position_prices;
CREATE TRIGGER update_service_position_prices_updated_at BEFORE UPDATE ON service_position_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user in users table when auth.users is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
    -- Use is_approved from metadata if present (for invites), otherwise default logic
    COALESCE(
      (NEW.raw_user_meta_data->>'is_approved')::boolean,
      CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'CUSTOMER' THEN true
        ELSE false
      END
    ),
    v_salon_id,
    -- If approved in metadata, set approved_by/at (logic simplified, ideally passed in metadata too or default to null for system/inviter)
    CASE WHEN (NEW.raw_user_meta_data->>'is_approved')::boolean = true THEN NEW.id ELSE NULL END, -- Self reference or NULL as placeholder
    CASE WHEN (NEW.raw_user_meta_data->>'is_approved')::boolean = true THEN NOW() ELSE NULL END
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update customer stats on booking completion
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    UPDATE customer_profiles
    SET
      total_bookings = total_bookings + 1,
      total_spent = total_spent + NEW.total_price,
      last_visit_at = NOW()
    WHERE user_id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_stats_trigger ON bookings;
CREATE TRIGGER update_customer_stats_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();
