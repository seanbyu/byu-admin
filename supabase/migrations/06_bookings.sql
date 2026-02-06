-- ============================================
-- Bookings & Reviews
-- ============================================

-- ============================================
-- Bookings Table
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Status
  status booking_status NOT NULL DEFAULT 'PENDING',

  -- Pricing
  service_price DECIMAL(10, 2) NOT NULL,
  additional_charges DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Payment
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  customer_notes TEXT,
  staff_notes TEXT,

  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- LINE notification
  line_notification_sent BOOLEAN NOT NULL DEFAULT false,
  line_notification_sent_at TIMESTAMP WITH TIME ZONE,

  -- Marketing metadata (per booking)
  booking_meta JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "channel": "line_liff",
  --   "device": "mobile",
  --   "utm_source": "line",
  --   "utm_campaign": "summer_sale",
  --   "coupon_code": "SUMMER20"
  -- }

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_total CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_artist ON bookings(artist_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_artist_date ON bookings(artist_id, booking_date, start_time);
CREATE INDEX idx_bookings_meta ON bookings USING gin (booking_meta jsonb_path_ops);

COMMENT ON TABLE bookings IS 'Customer bookings/appointments';
COMMENT ON COLUMN bookings.artist_id IS 'Staff performing the service';
COMMENT ON COLUMN bookings.booking_meta IS 'Booking channel and marketing attribution data';

-- ============================================
-- Reviews Table
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

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

CREATE INDEX idx_reviews_salon ON reviews(salon_id) WHERE is_visible = true;
CREATE INDEX idx_reviews_artist ON reviews(artist_id) WHERE is_visible = true;
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

COMMENT ON TABLE reviews IS 'Customer reviews for completed bookings';
