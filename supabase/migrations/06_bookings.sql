-- ============================================
-- Bookings Table
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- Customer Link (Composite FK)
  customer_id UUID NOT NULL,
  customer_user_type user_type NOT NULL DEFAULT 'CUSTOMER',

  -- Designer Link (Composite FK)
  designer_id UUID NOT NULL,
  designer_user_type user_type NOT NULL DEFAULT 'ADMIN_USER',

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

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_total CHECK (total_price >= 0),

  -- Ensure user types are correct for the role
  CONSTRAINT booking_customer_type_check CHECK (customer_user_type = 'CUSTOMER'),
  CONSTRAINT booking_designer_type_check CHECK (designer_user_type = 'ADMIN_USER'),

  -- Composite Foreign Keys
  FOREIGN KEY (customer_id, customer_user_type) REFERENCES users(id, user_type) ON DELETE CASCADE,
  FOREIGN KEY (designer_id, designer_user_type) REFERENCES users(id, user_type) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_designer ON bookings(designer_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_designer_date ON bookings(designer_id, booking_date, start_time);

-- Comments
COMMENT ON TABLE bookings IS 'Customer bookings/appointments';

-- ============================================
-- Reviews Table
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

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
