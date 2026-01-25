-- ============================================
-- Staff Positions Table (customizable per salon)
-- ============================================

CREATE TABLE staff_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
