-- ============================================
-- Reviews Table
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Rating (1-5)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Review content
  comment TEXT,

  -- Media
  images TEXT[] DEFAULT '{}',

  -- Response from salon
  response TEXT,
  response_by UUID REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_visible BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_salon ON reviews(salon_id) WHERE is_visible = true;
CREATE INDEX idx_reviews_designer ON reviews(designer_id) WHERE is_visible = true;
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

-- Comments
COMMENT ON TABLE reviews IS 'Customer reviews for completed bookings';
