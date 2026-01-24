-- ============================================
-- Public Read Policy for Staff (Customer-facing)
-- 고객용 앱에서 예약 가능한 직원 정보를 공개적으로 조회할 수 있도록 허용
-- ============================================

-- 공개적으로 활성화된 살롱의 직원 정보를 조회할 수 있도록 허용
CREATE POLICY "Public can view active salon staff"
  ON users FOR SELECT
  USING (
    user_type = 'ADMIN_USER'
    AND is_active = true
    AND salon_id IN (
      SELECT id FROM salons
      WHERE is_active = true
      AND approval_status = 'approved'
      AND deleted_at IS NULL
    )
  );

-- staff_profiles 테이블에 공개 읽기 정책 추가
CREATE POLICY "Public can view staff profiles for bookings"
  ON staff_profiles FOR SELECT
  USING (
    is_booking_enabled = true
    AND user_id IN (
      SELECT id FROM users
      WHERE user_type = 'ADMIN_USER'
      AND is_active = true
      AND salon_id IN (
        SELECT id FROM salons
        WHERE is_active = true
        AND approval_status = 'approved'
        AND deleted_at IS NULL
      )
    )
  );

COMMENT ON POLICY "Public can view active salon staff" ON users IS 'Allow public (anonymous) access to view active staff members of approved salons';
COMMENT ON POLICY "Public can view staff profiles for bookings" ON staff_profiles IS 'Allow public access to view staff profiles for booking-enabled staff';
