-- ============================================
-- Users Table (Unified for admin users and LINE customers)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Discriminator
  user_type user_type NOT NULL,
  role user_role NOT NULL DEFAULT 'ADMIN',

  -- Basic info
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,

  -- Auth info
  auth_provider auth_provider NOT NULL DEFAULT 'EMAIL',
  provider_user_id TEXT,  -- ID from social provider (LINE, Google, etc.)

  -- LINE profile (for LINE login users)
  line_profile JSONB DEFAULT NULL,
  -- Example: {"displayName": "홍길동", "pictureUrl": "...", "statusMessage": "..."}

  -- Customer link (for LINE users linked to salon customer)
  customer_id UUID,  -- Will add FK after customers table is created

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_user_type_role CHECK (
    (user_type = 'SALON' AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')) OR
    (user_type = 'CUSTOMER' AND role = 'CUSTOMER')
  )
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_user_type ON users(user_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_provider ON users(auth_provider, provider_user_id);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

COMMENT ON TABLE users IS 'Unified users table for both admin users and LINE customers';
COMMENT ON COLUMN users.customer_id IS 'Link to customers table (for LINE login users)';
COMMENT ON COLUMN users.line_profile IS 'LINE profile data for LINE login users';
