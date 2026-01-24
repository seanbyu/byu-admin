-- ============================================
-- Public Read Policy for Staff (Customer-facing)
-- 고객용 앱에서 예약 가능한 직원 정보를 공개적으로 조회할 수 있도록 허용
-- ============================================

-- users 테이블: salon_id가 있고 활성화된 ADMIN_USER만 공개
CREATE POLICY "Public can view active salon staff"
  ON users FOR SELECT
  USING (
    user_type = 'ADMIN_USER'
    AND is_active = true
    AND salon_id IS NOT NULL
  );

-- staff_profiles 테이블: is_booking_enabled = true인 직원만 공개
CREATE POLICY "Public can view staff profiles for bookings"
  ON staff_profiles FOR SELECT
  USING (
    is_booking_enabled = true
  );

COMMENT ON POLICY "Public can view active salon staff" ON users IS 'Allow public (anonymous) access to view active staff members';
COMMENT ON POLICY "Public can view staff profiles for bookings" ON staff_profiles IS 'Allow public access to view staff profiles for booking-enabled staff';
