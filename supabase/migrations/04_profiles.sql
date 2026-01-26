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

-- Indexes
CREATE INDEX idx_staff_positions_salon ON staff_positions(salon_id) WHERE is_active = true;
CREATE INDEX idx_staff_positions_level ON staff_positions(salon_id, level);

-- Comments
COMMENT ON TABLE staff_positions IS 'Customizable staff positions per salon (디렉터, 스페셜 디렉터, etc.)';
COMMENT ON COLUMN staff_positions.level IS 'Hierarchy level for pricing (1=lowest, higher=more expensive)';

-- ============================================
-- Staff Profiles Table
-- ============================================
CREATE TABLE staff_profiles (
  user_id UUID PRIMARY KEY,
  user_type user_type NOT NULL DEFAULT 'ADMIN_USER',

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

  -- Work schedule (JSONB for flexible schedule management)
  work_schedule JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "08:00", "end": "22:00"},
    "tuesday": {"enabled": true, "start": "08:00", "end": "22:00"},
    "wednesday": {"enabled": true, "start": "08:00", "end": "22:00"},
    "thursday": {"enabled": true, "start": "08:00", "end": "22:00"},
    "friday": {"enabled": true, "start": "08:00", "end": "22:00"},
    "saturday": {"enabled": true, "start": "08:00", "end": "22:00"},
    "sunday": {"enabled": false, "start": null, "end": null}
  }'::jsonb,

  -- Holidays (휴가)
  holidays JSONB DEFAULT '[]'::jsonb,

  -- Additional info
  bio TEXT,
  specialties TEXT[],
  years_of_experience INTEGER,

  -- Social media links
  social_links JSONB DEFAULT '{
    "instagram": null,
    "tiktok": null,
    "youtube": null,
    "facebook": null,
    "twitter": null,
    "website": null
  }'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Ensure this profile is only for ADMIN_USER
  CONSTRAINT staff_user_type_check CHECK (user_type = 'ADMIN_USER'),
  FOREIGN KEY (user_id, user_type) REFERENCES users(id, user_type) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_staff_profiles_position ON staff_profiles(position_id);

-- Comments
COMMENT ON TABLE staff_profiles IS 'Additional profile data for staff users (admins, managers, staff)';
COMMENT ON COLUMN staff_profiles.position_id IS 'Reference to customizable staff position';
COMMENT ON COLUMN staff_profiles.permissions IS 'JSONB custom permissions for granular access control';
COMMENT ON COLUMN staff_profiles.social_links IS 'Social media links (Instagram, TikTok, YouTube, etc.)';
COMMENT ON COLUMN staff_profiles.is_booking_enabled IS 'Determines if the staff member can receive bookings';
COMMENT ON COLUMN staff_profiles.holidays IS 'Staff vacation/off dates as JSON array';

-- ============================================
-- Customer Profiles Table
-- ============================================
CREATE TABLE customer_profiles (
  user_id UUID PRIMARY KEY,
  user_type user_type NOT NULL DEFAULT 'CUSTOMER',

  -- LINE integration
  line_user_id TEXT UNIQUE,
  line_display_name TEXT,
  line_picture_url TEXT,
  line_status_message TEXT,

  -- Customer preferences
  preferred_salon_id UUID REFERENCES salons(id) ON DELETE SET NULL,
  preferred_designer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  preferences JSONB DEFAULT '{}'::jsonb, -- Styling preferences, allergies, etc.

  -- Customer stats
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMP WITH TIME ZONE,

  -- Marketing
  marketing_consent BOOLEAN NOT NULL DEFAULT false,

  -- Notes (visible to staff)
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Ensure this profile is only for CUSTOMER
  CONSTRAINT customer_user_type_check CHECK (user_type = 'CUSTOMER'),
  FOREIGN KEY (user_id, user_type) REFERENCES users(id, user_type) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_customer_profiles_line ON customer_profiles(line_user_id);
CREATE INDEX idx_customer_profiles_salon ON customer_profiles(preferred_salon_id);

-- Comments
COMMENT ON TABLE customer_profiles IS 'Additional profile data for customers with LINE integration';
COMMENT ON COLUMN customer_profiles.line_user_id IS 'LINE user ID for LINE login and notifications';
