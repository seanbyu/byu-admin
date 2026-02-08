-- ============================================
-- Staff Display Order for Booking UI
-- 예약 UI에서 직원 표시 순서 설정
-- ============================================

-- Add display_order column to staff_profiles
ALTER TABLE staff_profiles
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_staff_profiles_display_order
ON staff_profiles(salon_id, display_order);

COMMENT ON COLUMN staff_profiles.display_order IS 'Display order in booking UI (lower = higher priority)';

-- Initialize display_order based on created_at for existing records
-- This ensures existing staff have a reasonable default order
UPDATE staff_profiles
SET display_order = subquery.row_num
FROM (
  SELECT user_id,
         ROW_NUMBER() OVER (PARTITION BY salon_id ORDER BY created_at) - 1 as row_num
  FROM staff_profiles
) AS subquery
WHERE staff_profiles.user_id = subquery.user_id
  AND staff_profiles.display_order = 0;
