-- ============================================
-- Customers Table (Salon-specific customer management)
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional link to registered user

  -- Customer info
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Visit tracking
  last_visit DATE,
  total_visits INTEGER NOT NULL DEFAULT 0,

  -- Customer type
  customer_type VARCHAR(20) DEFAULT 'local', -- 'local' or 'foreign'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Unique constraint: one customer per salon (by phone or name for foreign customers)
  CONSTRAINT unique_customer_phone UNIQUE (salon_id, phone) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_customers_salon ON customers(salon_id);
CREATE INDEX idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE INDEX idx_customers_name ON customers(salon_id, name);

-- Comments
COMMENT ON TABLE customers IS 'Salon-specific customer records for booking management';

-- ============================================
-- Row Level Security for Customers
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Salon staff can view their salon's customers
CREATE POLICY "Salon staff can view their customers"
  ON customers FOR SELECT
  USING (
    salon_id = get_my_salon_id()
  );

-- Salon staff can create customers
CREATE POLICY "Salon staff can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

-- Salon staff can update their customers
CREATE POLICY "Salon staff can update their customers"
  ON customers FOR UPDATE
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')
  );

-- Salon managers can delete customers
CREATE POLICY "Salon managers can delete customers"
  ON customers FOR DELETE
  USING (
    salon_id = get_my_salon_id() AND
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );
