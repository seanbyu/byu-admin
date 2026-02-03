-- ============================================
-- Fix bookings.customer_id foreign key constraint
-- Change from users(id) to customers(id)
-- ============================================

-- Drop existing foreign key constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

-- Add new foreign key constraint referencing customers table
ALTER TABLE bookings
ADD CONSTRAINT bookings_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Update booking_repository query to join customers table instead of users
COMMENT ON COLUMN bookings.customer_id IS 'References customers(id) - salon-specific customer record';
