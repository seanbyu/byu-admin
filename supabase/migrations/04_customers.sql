-- ============================================
-- Customers Table (Consolidated - includes LINE integration & marketing)
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Optional: linked LINE user
  primary_artist_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 주 담당 아티스트

  -- Customer info
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  customer_type customer_type DEFAULT 'local',

  -- Notes
  notes TEXT,

  -- Visit tracking (auto-updated by triggers)
  last_visit DATE,
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  no_show_count INTEGER NOT NULL DEFAULT 0,

  -- LINE integration (when linked to user)
  line_user_id TEXT,
  line_display_name TEXT,
  line_picture_url TEXT,

  -- Marketing metadata (MVP)
  acquisition_meta JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "utm_source": "line",
  --   "utm_medium": "social",
  --   "utm_campaign": "spring_2024",
  --   "referrer": "instagram",
  --   "first_booking_channel": "line_liff",
  --   "registered_via": "line_login"
  -- }

  -- Customer preferences
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "preferred_artist_id": "uuid",
  --   "allergies": ["latex"],
  --   "style_preferences": ["natural"]
  -- }

  -- Marketing consent
  marketing_consent BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Unique constraint: one customer per salon (by phone)
  CONSTRAINT unique_customer_phone UNIQUE (salon_id, phone) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_customers_salon ON customers(salon_id);
CREATE INDEX idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE INDEX idx_customers_name ON customers(salon_id, name);
CREATE INDEX idx_customers_user ON customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_customers_primary_artist ON customers(primary_artist_id);
CREATE INDEX idx_customers_line_user ON customers(line_user_id) WHERE line_user_id IS NOT NULL;
CREATE INDEX idx_customers_acquisition ON customers USING gin (acquisition_meta jsonb_path_ops);
CREATE INDEX idx_customers_last_visit ON customers(salon_id, last_visit DESC);
CREATE INDEX idx_customers_total_spent ON customers(salon_id, total_spent DESC);

COMMENT ON TABLE customers IS 'Salon-specific customer records with LINE integration and marketing data';
COMMENT ON COLUMN customers.user_id IS 'Optional link to users table (for LINE login customers)';
COMMENT ON COLUMN customers.acquisition_meta IS 'Marketing attribution data (utm_source, campaign, etc.)';
COMMENT ON COLUMN customers.no_show_count IS 'Number of no-shows (auto-updated by trigger)';
COMMENT ON COLUMN customers.total_spent IS 'Total amount spent (auto-updated by trigger)';

-- ============================================
-- Add FK from users.customer_id to customers.id
-- ============================================
ALTER TABLE users
ADD CONSTRAINT fk_users_customer
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Ensure 1:1 relationship (one user = one customer)
CREATE UNIQUE INDEX idx_users_customer_unique
ON users(customer_id) WHERE customer_id IS NOT NULL;
