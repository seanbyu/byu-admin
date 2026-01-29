-- ============================================
-- Row Level Security Policies
-- ============================================

-- ============================================
-- Industries & Salon Industries
-- ============================================
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industries are viewable by everyone"
  ON industries FOR SELECT
  USING (true);

ALTER TABLE salon_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon industries viewable by everyone"
  ON salon_industries FOR SELECT
  USING (true);

CREATE POLICY "Salon admins can manage salon industries"
  ON salon_industries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND salon_id = salon_industries.salon_id
      AND role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Salon Images
-- ============================================
ALTER TABLE salon_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view salon images"
  ON salon_images FOR SELECT
  USING (true);

CREATE POLICY "Salon admins can manage salon images"
  ON salon_images FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Salons
-- ============================================
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active salons"
  ON salons FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Super admins can manage all salons"
  ON salons FOR ALL
  USING (
    get_my_role() = 'SUPER_ADMIN'
  );

CREATE POLICY "Admins can update their own salon"
  ON salons FOR UPDATE
  USING (
    id = get_my_salon_id() AND
    get_my_role() IN ('ADMIN', 'MANAGER')
  );

-- ============================================
-- Users
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
    get_my_role() = 'SUPER_ADMIN'
  );

-- Users can view same salon users
CREATE POLICY "Users can view same salon users"
  ON users FOR SELECT
  USING (
    salon_id = get_my_salon_id()
  );

-- Public can view active salon staff (for booking)
CREATE POLICY "Public can view active salon staff"
  ON users FOR SELECT
  USING (
    user_type = 'ADMIN_USER'
    AND is_active = true
    AND salon_id IS NOT NULL
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can create users in their salon
CREATE POLICY "Admins can create users in their salon"
  ON users FOR INSERT
  WITH CHECK (
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') AND
    (
      get_my_role() = 'SUPER_ADMIN' OR
      salon_id = get_my_salon_id()
    )
  );

-- ============================================
-- Staff Positions
-- ============================================
ALTER TABLE staff_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active positions"
  ON staff_positions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Salon admins can manage positions"
  ON staff_positions FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Staff Profiles
-- ============================================
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff users can view their own profile"
  ON staff_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff users in same salon can view each other"
  ON staff_profiles FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE salon_id = get_my_salon_id()
    )
  );

CREATE POLICY "Public can view staff profiles for bookings"
  ON staff_profiles FOR SELECT
  USING (
    is_booking_enabled = true
  );

CREATE POLICY "Admins and Managers can update staff profiles in their salon"
  ON staff_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS acting_user
      WHERE acting_user.id = auth.uid()
      AND acting_user.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND acting_user.salon_id = (
        SELECT target_user.salon_id FROM users AS target_user
        WHERE target_user.id = staff_profiles.user_id
      )
    )
  );

CREATE POLICY "Admins and Managers can insert staff profiles"
  ON staff_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS acting_user
      WHERE acting_user.id = auth.uid()
      AND acting_user.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
      AND acting_user.salon_id = (
        SELECT target_user.salon_id FROM users AS target_user
        WHERE target_user.id = staff_profiles.user_id
      )
    )
  );

-- ============================================
-- Customer Profiles
-- ============================================
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

-- ============================================
-- Service Categories
-- ============================================
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON service_categories FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Salon managers can manage their categories"
  ON service_categories FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Services
-- ============================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Salon managers can manage their services"
  ON services FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Service Position Prices
-- ============================================
ALTER TABLE service_position_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service prices"
  ON service_position_prices FOR SELECT
  USING (true);

CREATE POLICY "Salon managers can manage service prices"
  ON service_position_prices FOR ALL
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE salon_id = get_my_salon_id()
    ) AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Bookings
-- ============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Designers can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = designer_id);

CREATE POLICY "Salon staff can view salon bookings"
  ON bookings FOR SELECT
  USING (
    salon_id = get_my_salon_id()
  );

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their pending bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'PENDING');

CREATE POLICY "Salon staff can manage salon bookings"
  ON bookings FOR ALL
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

-- ============================================
-- Reviews
-- ============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews"
  ON reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Customers can create reviews for completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND status = 'COMPLETED'
    )
  );

CREATE POLICY "Customers can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Salon staff can respond to reviews"
  ON reviews FOR UPDATE
  USING (
    salon_id = get_my_salon_id()
  );
