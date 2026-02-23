-- ============================================
-- Booking Availability RPC Function
-- RLS를 우회하여 살롱의 예약 가용성 정보만 반환
-- 고객 정보 등 민감한 데이터는 노출하지 않음
-- ============================================

CREATE OR REPLACE FUNCTION get_salon_availability(
  p_salon_id UUID,
  p_booking_date DATE
)
RETURNS TABLE (
  artist_id UUID,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.artist_id,
    b.start_time,
    b.end_time,
    b.duration_minutes,
    b.status::TEXT
  FROM bookings b
  WHERE b.salon_id = p_salon_id
    AND b.booking_date = p_booking_date
    AND b.status NOT IN ('CANCELLED', 'NO_SHOW');
$$;

COMMENT ON FUNCTION get_salon_availability IS
  'Returns minimal booking slot data for a salon on a given date. Used by customer-facing app to check time slot availability without exposing private booking details.';

-- ============================================
-- Designer Availability RPC Function
-- ============================================

CREATE OR REPLACE FUNCTION get_designer_availability(
  p_artist_id UUID,
  p_booking_date DATE
)
RETURNS TABLE (
  artist_id UUID,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.artist_id,
    b.start_time,
    b.end_time,
    b.duration_minutes,
    b.status::TEXT
  FROM bookings b
  WHERE b.artist_id = p_artist_id
    AND b.booking_date = p_booking_date
    AND b.status NOT IN ('CANCELLED', 'NO_SHOW');
$$;

COMMENT ON FUNCTION get_designer_availability IS
  'Returns minimal booking slot data for a designer on a given date. Used by customer-facing app to check time slot availability.';
