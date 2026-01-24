-- ============================================
-- ENUMS
-- ============================================

-- User type discriminator
CREATE TYPE user_type AS ENUM ('ADMIN_USER', 'CUSTOMER');

-- User roles (System-level permissions)
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',    -- Platform owner (manages all salons)
  'ADMIN',          -- Salon owner (default on signup)
  'MANAGER',        -- Salon manager
  'STAFF',          -- General staff
  'CUSTOMER'        -- Customer
);

-- Auth provider types
CREATE TYPE auth_provider AS ENUM (
  'EMAIL',          -- Email/password
  'LINE',           -- LINE login
  'GOOGLE',         -- Google OAuth
  'KAKAO'           -- Kakao login
);



-- Booking status
CREATE TYPE booking_status AS ENUM (
  'PENDING',        -- 예약 대기
  'CONFIRMED',      -- 예약 확정
  'IN_PROGRESS',    -- 시술 중
  'COMPLETED',      -- 완료
  'CANCELLED',      -- 취소
  'NO_SHOW'         -- 노쇼
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PAID',
  'REFUNDED',
  'FAILED'
);
