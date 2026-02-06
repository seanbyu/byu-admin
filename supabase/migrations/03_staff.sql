-- ============================================
-- Staff Positions & Profiles
-- ============================================

-- ============================================
-- Staff Positions Table (customizable per salon)
-- ============================================
CREATE TABLE staff_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- Position info
  name TEXT NOT NULL,           -- "디렉터", "스페셜 디렉터", "주니어"
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  -- Hierarchy level (used for service pricing)
  level INTEGER NOT NULL DEFAULT 1,  -- 1=junior, 2=mid, 3=senior, etc.

  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, name)
);

CREATE INDEX idx_staff_positions_salon ON staff_positions(salon_id) WHERE is_active = true;
CREATE INDEX idx_staff_positions_level ON staff_positions(salon_id, level);

COMMENT ON TABLE staff_positions IS 'Customizable staff positions per salon (디렉터, 스페셜 디렉터, etc.)';
COMMENT ON COLUMN staff_positions.level IS 'Hierarchy level for pricing (1=lowest, higher=more expensive)';

-- ============================================
-- Staff Profiles Table
-- ============================================
CREATE TABLE staff_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Salon association
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- Owner flag (salon owner/representative)
  is_owner BOOLEAN NOT NULL DEFAULT false,

  -- Approval workflow
  is_approved BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Hierarchy tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Position (customizable by salon)
  position_id UUID REFERENCES staff_positions(id) ON DELETE SET NULL,

  -- Booking enabled
  is_booking_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Custom permissions (JSONB for flexibility)
  permissions JSONB NOT NULL DEFAULT '{
    "bookings": {"view": true, "create": true, "edit": true, "delete": false},
    "customers": {"view": true, "create": true, "edit": true, "delete": false},
    "services": {"view": true, "create": false, "edit": false, "delete": false},
    "staff": {"view": true, "create": false, "edit": false, "delete": false},
    "settings": {"view": false, "edit": false}
  }'::jsonb,

  -- Work schedule
  work_schedule JSONB DEFAULT '{
    "monday": {"enabled": false, "start": null, "end": null},
    "tuesday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "wednesday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "thursday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "friday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "saturday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "sunday": {"enabled": true, "start": "10:00", "end": "21:00"}
  }'::jsonb,

  -- Holidays (휴가)
  holidays JSONB DEFAULT '[]'::jsonb,

  -- Additional info
  bio TEXT,
  specialties TEXT[],
  years_of_experience INTEGER,

  -- Social media links
  social_links JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_profiles_salon ON staff_profiles(salon_id);
CREATE INDEX idx_staff_profiles_position ON staff_profiles(position_id);
CREATE INDEX idx_staff_profiles_created_by ON staff_profiles(created_by);

-- Ensure only one owner per salon
CREATE UNIQUE INDEX idx_staff_profiles_salon_owner ON staff_profiles(salon_id) WHERE is_owner = true;

COMMENT ON TABLE staff_profiles IS 'Additional profile data for staff users';
COMMENT ON COLUMN staff_profiles.is_booking_enabled IS 'Determines if the staff member can receive bookings';
