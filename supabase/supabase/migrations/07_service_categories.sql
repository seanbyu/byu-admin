-- ============================================
-- Service Categories Table
-- ============================================

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

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

-- Indexes
CREATE INDEX idx_service_categories_salon ON service_categories(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_categories_active ON service_categories(is_active, salon_id) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE service_categories IS 'Service categories for organizing services (CUT, PERM, COLOR, etc.)';
