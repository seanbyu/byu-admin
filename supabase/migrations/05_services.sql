-- ============================================
-- Services & Pricing
-- ============================================

-- ============================================
-- Service Categories Table
-- ============================================
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,

  -- Category info
  name TEXT NOT NULL,           -- "CUT", "PERM", "COLOR", "CLINIC"
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, name)
);

CREATE INDEX idx_service_categories_salon ON service_categories(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_categories_active ON service_categories(is_active, salon_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_categories_industry ON service_categories(industry_id);

COMMENT ON TABLE service_categories IS 'Service categories for organizing services (CUT, PERM, COLOR, etc.)';

-- ============================================
-- Services Table
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,

  -- Service info
  name TEXT NOT NULL,
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  -- Pricing type
  pricing_type TEXT NOT NULL DEFAULT 'POSITION_BASED',  -- 'FIXED' | 'POSITION_BASED'

  -- Price (used only when pricing_type='FIXED')
  base_price DECIMAL(10, 2),

  -- Duration
  duration_minutes INTEGER NOT NULL,

  -- Media
  image_url TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_pricing_type CHECK (pricing_type IN ('FIXED', 'POSITION_BASED')),
  CONSTRAINT fixed_price_required CHECK (
    (pricing_type = 'FIXED' AND base_price IS NOT NULL) OR
    (pricing_type = 'POSITION_BASED')
  ),
  UNIQUE (id, pricing_type)  -- For composite FK in service_position_prices
);

CREATE INDEX idx_services_salon ON services(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_category ON services(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_active ON services(is_active, salon_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_pricing_type ON services(pricing_type);

COMMENT ON TABLE services IS 'Services offered by salons';

-- ============================================
-- Service Position Prices Table
-- ============================================
CREATE TABLE service_position_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES staff_positions(id) ON DELETE CASCADE,

  -- Required for composite FK
  pricing_type TEXT NOT NULL DEFAULT 'POSITION_BASED',

  -- Price for this position level
  price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(service_id, position_id),

  CONSTRAINT position_prices_type_check CHECK (pricing_type = 'POSITION_BASED'),
  FOREIGN KEY (service_id, pricing_type) REFERENCES services(id, pricing_type) ON DELETE CASCADE
);

CREATE INDEX idx_service_position_prices_service ON service_position_prices(service_id);
CREATE INDEX idx_service_position_prices_position ON service_position_prices(position_id);

COMMENT ON TABLE service_position_prices IS 'Position-based pricing for services';
