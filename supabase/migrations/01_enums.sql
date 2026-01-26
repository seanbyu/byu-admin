-- ============================================
-- Extensions
-- ============================================
-- Note: Using gen_random_uuid() instead of gen_random_uuid()
-- gen_random_uuid() is built-in to PostgreSQL 13+

-- ============================================
-- ENUMS (Idempotent - safe to rerun)
-- ============================================

-- User type discriminator
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('ADMIN_USER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User roles (System-level permissions)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',    -- Platform owner (manages all salons)
    'ADMIN',          -- Salon owner (default on signup)
    'MANAGER',        -- Salon manager
    'STAFF',          -- General staff
    'CUSTOMER'        -- Customer
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auth provider types
DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM (
    'EMAIL',          -- Email/password
    'LINE',           -- LINE login
    'GOOGLE',         -- Google OAuth
    'KAKAO'           -- Kakao login
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Salon approval status (플랫폼 관리자가 승인)
DO $$ BEGIN
  CREATE TYPE approval_status_type AS ENUM (
    'pending',        -- 승인 대기
    'approved',       -- 승인됨
    'rejected'        -- 거절됨
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Booking status
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'PENDING',        -- 예약 대기
    'CONFIRMED',      -- 예약 확정
    'IN_PROGRESS',    -- 시술 중
    'COMPLETED',      -- 완료
    'CANCELLED',      -- 취소
    'NO_SHOW'         -- 노쇼
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'REFUNDED',
    'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
