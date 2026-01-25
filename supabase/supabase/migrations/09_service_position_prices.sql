-- ============================================
-- Service Position Prices Table
-- ============================================
-- Used only for services with pricing_type='POSITION_BASED'

CREATE TABLE service_position_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES staff_positions(id) ON DELETE CASCADE,
  
  -- Required for composite FK
  pricing_type TEXT NOT NULL DEFAULT 'POSITION_BASED',

  -- Price for this position level
  price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(service_id, position_id),

  -- Ensure this is only used for POSITION_BASED services
  CONSTRAINT position_prices_type_check CHECK (pricing_type = 'POSITION_BASED'),
  FOREIGN KEY (service_id, pricing_type) REFERENCES services(id, pricing_type) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_service_position_prices_service ON service_position_prices(service_id);
CREATE INDEX idx_service_position_prices_position ON service_position_prices(position_id);

-- Comments
COMMENT ON TABLE service_position_prices IS 'Position-based pricing for services (only when pricing_type=POSITION_BASED)';
