-- Add is_booking_enabled column to staff_profiles table
ALTER TABLE staff_profiles 
ADD COLUMN is_booking_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN staff_profiles.is_booking_enabled IS 'Determines if the staff member can receive bookings';
