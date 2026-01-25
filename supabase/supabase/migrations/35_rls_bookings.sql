-- ============================================
-- Row Level Security - Bookings
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = customer_id);

-- Designers can view their own bookings
CREATE POLICY "Designers can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = designer_id);

-- Salon staff can view salon bookings
CREATE POLICY "Salon staff can view salon bookings"
  ON bookings FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id FROM users WHERE id = auth.uid()
    )
  );

-- Customers can create bookings
CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their pending bookings
CREATE POLICY "Customers can update their pending bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'PENDING');

-- Salon staff can manage salon bookings
CREATE POLICY "Salon staff can manage salon bookings"
  ON bookings FOR ALL
  USING (
    salon_id IN (
      SELECT salon_id FROM users
      WHERE id = auth.uid() AND user_type = 'ADMIN_USER'
    )
  );
