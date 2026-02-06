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
      SELECT 1 FROM staff_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.user_id = auth.uid()
      AND sp.salon_id = salon_industries.salon_id
      AND u.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
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
  USING (get_my_role() = 'SUPER_ADMIN');

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

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  USING (get_my_role() = 'SUPER_ADMIN');

CREATE POLICY "Users can view same salon users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles my_sp
      JOIN staff_profiles their_sp ON my_sp.salon_id = their_sp.salon_id
      WHERE my_sp.user_id = auth.uid()
      AND their_sp.user_id = users.id
    )
  );

CREATE POLICY "Public can view active salon staff"
  ON users FOR SELECT
  USING (
    user_type = 'SALON'
    AND is_active = true
    AND EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = users.id
      AND sp.salon_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can create users in their salon"
  ON users FOR INSERT
  WITH CHECK (get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

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
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Public can view staff profiles for bookings"
  ON staff_profiles FOR SELECT
  USING (is_booking_enabled = true);

CREATE POLICY "Admins and Managers can update staff profiles"
  ON staff_profiles FOR UPDATE
  USING (
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    AND salon_id = get_my_salon_id()
  );

CREATE POLICY "Admins and Managers can insert staff profiles"
  ON staff_profiles FOR INSERT
  WITH CHECK (
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    AND salon_id = get_my_salon_id()
  );

-- ============================================
-- Customers
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their customers"
  ON customers FOR SELECT
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon staff can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

CREATE POLICY "Salon staff can update their customers"
  ON customers FOR UPDATE
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

CREATE POLICY "Salon managers can delete customers"
  ON customers FOR DELETE
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- Customers can view their own record (via user_id link)
CREATE POLICY "Customers can view their own customer record"
  ON customers FOR SELECT
  USING (user_id = auth.uid());

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
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = bookings.customer_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Artists can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Salon staff can view salon bookings"
  ON bookings FOR SELECT
  USING (salon_id = get_my_salon_id());

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = bookings.customer_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update their pending bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = bookings.customer_id
      AND c.user_id = auth.uid()
    )
    AND status = 'PENDING'
  );

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
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = reviews.customer_id
      AND c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND status = 'COMPLETED'
    )
  );

CREATE POLICY "Customers can update their own reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = reviews.customer_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Salon staff can respond to reviews"
  ON reviews FOR UPDATE
  USING (salon_id = get_my_salon_id());

-- ============================================
-- User Favorite Salons
-- ============================================
ALTER TABLE user_favorite_salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON user_favorite_salons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON user_favorite_salons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON user_favorite_salons FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Salon admins can view their salon favorites"
  ON user_favorite_salons FOR SELECT
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- User Favorite Artists
-- ============================================
ALTER TABLE user_favorite_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite artists"
  ON user_favorite_artists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite artists"
  ON user_favorite_artists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorite artists"
  ON user_favorite_artists FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Artists can view who favorited them"
  ON user_favorite_artists FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Salon admins can view their artists favorites"
  ON user_favorite_artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = user_favorite_artists.artist_id
      AND sp.salon_id = get_my_salon_id()
    ) AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );
