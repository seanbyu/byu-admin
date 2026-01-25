-- ============================================
-- Users Table (unified for both admin users and customers)
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
  provider_user_id TEXT, -- ID from social provider (LINE, Google, etc.)

  -- Salon association (NULL for SUPER_ADMIN, required for others)
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,

  -- Hierarchy tracking
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Approval workflow (for admin users)
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_user_type_role CHECK (
    (user_type = 'ADMIN_USER' AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF')) OR
    (user_type = 'CUSTOMER' AND role = 'CUSTOMER')
  ),
  CONSTRAINT super_admin_no_salon CHECK (
    (role = 'SUPER_ADMIN' AND salon_id IS NULL) OR
    (role != 'SUPER_ADMIN')
  ),
  UNIQUE (id, user_type) -- Added for composite FK reference
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_salon_id ON users(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_user_type ON users(user_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_by ON users(created_by);
CREATE INDEX idx_users_provider ON users(auth_provider, provider_user_id);
CREATE INDEX idx_users_approval ON users(is_approved, user_type) WHERE user_type = 'ADMIN_USER';

-- Comments
COMMENT ON TABLE users IS 'Unified users table for both admin users and customers';
COMMENT ON COLUMN users.user_type IS 'Discriminator: ADMIN_USER or CUSTOMER';
COMMENT ON COLUMN users.role IS 'System-level role for permissions (SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)';
COMMENT ON COLUMN users.is_approved IS 'Approval status for admin users (customers auto-approved)';
COMMENT ON COLUMN users.auth_provider IS 'Authentication method used';
COMMENT ON COLUMN users.created_by IS 'User ID who created this account (for hierarchy tracking)';
