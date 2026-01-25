-- ============================================
-- Add holidays field to salons and staff_profiles
-- ============================================

-- Add holidays JSONB field to salons table
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS holidays JSONB DEFAULT '[]'::jsonb;

-- Add holidays JSONB field to staff_profiles table
ALTER TABLE staff_profiles
ADD COLUMN IF NOT EXISTS holidays JSONB DEFAULT '[]'::jsonb;

-- Comments
COMMENT ON COLUMN salons.holidays IS 'Shop holiday/closure dates as JSON array: [{"id": "...", "startDate": "2024-01-01", "endDate": "2024-01-03", "reason": "New Year"}]';
COMMENT ON COLUMN staff_profiles.holidays IS 'Staff vacation/off dates as JSON array: [{"id": "...", "startDate": "2024-01-01", "endDate": "2024-01-03", "reason": "Annual leave"}]';
