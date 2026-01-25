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
