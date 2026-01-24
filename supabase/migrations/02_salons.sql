-- ============================================
-- Industries Table (Dynamic)
-- ============================================
CREATE TABLE industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Salons Table
-- ============================================

CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Contact
  phone TEXT NOT NULL,
  email TEXT,

  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'TH',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Business hours (JSONB for flexibility)
  business_hours JSONB DEFAULT '{
    "monday": {"enabled": true, "open": "09:00", "close": "18:00"},
    "tuesday": {"enabled": true, "open": "09:00", "close": "18:00"},
    "wednesday": {"enabled": true, "open": "09:00", "close": "18:00"},
    "thursday": {"enabled": true, "open": "09:00", "close": "18:00"},
    "friday": {"enabled": true, "open": "09:00", "close": "18:00"},
    "saturday": {"enabled": true, "open": "09:00", "close": "18:00"},
    "sunday": {"enabled": false, "open": null, "close": null}
  }'::jsonb,

  -- Media (Logo and Cover only, others in salon_images)
  logo_url TEXT,
  cover_image_url TEXT,

  -- Settings
  settings JSONB DEFAULT '{
    "booking_advance_days": 30,
    "booking_cancellation_hours": 24,
    "slot_duration_minutes": 30,
    "currency": "THB",
    "timezone": "Asia/Bangkok"
  }'::jsonb,

  -- Status
  approval_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_salons_active ON salons(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_salons_location ON salons(latitude, longitude) WHERE deleted_at IS NULL;
CREATE INDEX idx_salons_approval ON salons(approval_status);

-- Comments
COMMENT ON TABLE salons IS 'Beauty salon information';

-- ============================================
-- Salon Industries (Many-to-Many)
-- ============================================
CREATE TABLE salon_industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
    UNIQUE (salon_id, industry_id)
);

CREATE INDEX idx_salon_industries_salon ON salon_industries(salon_id);
CREATE INDEX idx_salon_industries_industry ON salon_industries(industry_id);

-- ============================================
-- Salon Images (Gallery)
-- ============================================
CREATE TABLE salon_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_salon_images_salon ON salon_images(salon_id);
