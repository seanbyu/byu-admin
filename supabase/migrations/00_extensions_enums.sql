-- ============================================
-- Extensions & ENUMs
-- Salon Store Admin Database Schema v2.0
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- User type discriminator
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM (
    'SALON',      -- 살롱 측 사용자 (B2B: ADMIN, MANAGER, ARTIST, STAFF)
    'CUSTOMER'    -- 고객 (B2C: LINE 예약 고객)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User roles (System-level permissions)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',    -- Platform owner (manages all salons)
    'ADMIN',          -- Salon owner (default on signup)
    'MANAGER',        -- Salon manager
    'ARTIST',         -- Artist/Designer (시술 담당)
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

-- Salon approval status
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

-- Customer type
DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM (
    'local',          -- 내국인
    'foreign'         -- 외국인
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
