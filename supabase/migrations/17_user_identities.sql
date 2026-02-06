-- ============================================
-- User Identities System (다중 소셜 로그인 지원)
-- ============================================
--
-- 목적: 한 유저가 여러 소셜 계정(LINE, Google, Kakao 등)을
--       연결하여 어떤 것으로든 로그인할 수 있도록 지원
--
-- 구조:
--   auth.users (Supabase) ─┐
--                          ├──► user_identities ──► users (1명)
--   auth.users (Supabase) ─┘
--

-- ============================================
-- 1. user_identities 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결 관계
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_id UUID NOT NULL UNIQUE,  -- auth.users.id 참조 (FK 제약 없음 - Supabase 관리)

  -- 소셜 로그인 정보
  provider auth_provider NOT NULL,  -- LINE, GOOGLE, KAKAO, EMAIL
  provider_user_id TEXT,            -- 소셜 서비스에서의 유저 ID

  -- 소셜 프로필 정보 (각 provider별 데이터)
  profile JSONB DEFAULT '{}'::jsonb,
  -- LINE: {"displayName": "홍길동", "pictureUrl": "https://...", "statusMessage": "..."}
  -- GOOGLE: {"email": "...", "name": "...", "picture": "...", "locale": "ko"}
  -- KAKAO: {"nickname": "...", "profile_image": "...", "email": "..."}

  -- 연동 상태
  is_primary BOOLEAN NOT NULL DEFAULT false,  -- 주 로그인 수단 여부
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)  -- 유저당 같은 provider 1개만
);

-- ============================================
-- 2. 인덱스
-- ============================================
CREATE INDEX idx_user_identities_user ON user_identities(user_id);
CREATE INDEX idx_user_identities_auth ON user_identities(auth_id);
CREATE INDEX idx_user_identities_provider ON user_identities(provider);
CREATE INDEX idx_user_identities_provider_user ON user_identities(provider, provider_user_id);

COMMENT ON TABLE user_identities IS '유저별 소셜 로그인 연동 정보 (다중 소셜 지원)';
COMMENT ON COLUMN user_identities.auth_id IS 'Supabase auth.users.id';
COMMENT ON COLUMN user_identities.provider_user_id IS '소셜 서비스에서 발급한 유저 ID (LINE U..., Google sub 등)';
COMMENT ON COLUMN user_identities.profile IS '소셜 서비스에서 가져온 프로필 정보';
COMMENT ON COLUMN user_identities.is_primary IS '주 로그인 수단 (프로필 사진 등에 사용)';

-- ============================================
-- 3. 기존 데이터 마이그레이션
-- ============================================
-- 기존 users 테이블의 소셜 로그인 정보를 user_identities로 이동

INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile, is_primary, connected_at)
SELECT
  id AS user_id,
  id AS auth_id,  -- 기존에는 users.id = auth.users.id 였음
  auth_provider AS provider,
  provider_user_id,
  COALESCE(line_profile, '{}'::jsonb) AS profile,
  true AS is_primary,  -- 기존 계정은 모두 primary
  created_at AS connected_at
FROM users
WHERE auth_provider IS NOT NULL
ON CONFLICT (auth_id) DO NOTHING;  -- 이미 있으면 스킵

-- ============================================
-- 4. users 테이블에서 이전 컬럼 삭제
-- ============================================
-- 주의: 마이그레이션 완료 후 실행!

-- 컬럼 삭제
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS provider_user_id;
ALTER TABLE users DROP COLUMN IF EXISTS line_profile;

-- primary identity 참조 추가 (선택사항)
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_identity_id UUID REFERENCES user_identities(id);

-- primary_identity_id 업데이트
UPDATE users u
SET primary_identity_id = ui.id
FROM user_identities ui
WHERE ui.user_id = u.id AND ui.is_primary = true;

COMMENT ON COLUMN users.primary_identity_id IS '주 로그인 수단 (프로필 사진 등에 사용)';

-- ============================================
-- 5. RLS 정책
-- ============================================
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

-- 본인의 identities만 조회 가능
CREATE POLICY "Users can view own identities"
  ON user_identities FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
    OR
    -- 또는 같은 살롱의 관리자
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND sp.salon_id IN (
        SELECT salon_id FROM staff_profiles WHERE user_id = user_identities.user_id
      )
      AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- 본인의 identities만 생성 가능
CREATE POLICY "Users can create own identities"
  ON user_identities FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  );

-- 본인의 identities만 수정 가능
CREATE POLICY "Users can update own identities"
  ON user_identities FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  );

-- 본인의 identities만 삭제 가능 (연동 해제)
CREATE POLICY "Users can delete own identities"
  ON user_identities FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
    -- 단, primary는 삭제 불가 (최소 1개는 유지)
    AND is_primary = false
  );

-- ============================================
-- 6. Triggers
-- ============================================

-- updated_at 자동 업데이트
CREATE TRIGGER update_user_identities_updated_at
BEFORE UPDATE ON user_identities
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- primary 변경 시 다른 identity의 is_primary를 false로
CREATE OR REPLACE FUNCTION ensure_single_primary_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- 같은 유저의 다른 identity들을 non-primary로
    UPDATE user_identities
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;

    -- users 테이블의 primary_identity_id 업데이트
    UPDATE users
    SET primary_identity_id = NEW.id
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_single_primary_identity
AFTER INSERT OR UPDATE OF is_primary ON user_identities
FOR EACH ROW
WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_identity();

-- ============================================
-- 7. 헬퍼 함수
-- ============================================

-- 소셜 로그인 시 유저 찾기 또는 생성
CREATE OR REPLACE FUNCTION find_or_create_user_by_identity(
  p_auth_id UUID,
  p_provider auth_provider,
  p_provider_user_id TEXT,
  p_profile JSONB,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  is_new_user BOOLEAN,
  is_new_identity BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_identity_id UUID;
  v_is_new_user BOOLEAN := false;
  v_is_new_identity BOOLEAN := false;
BEGIN
  -- 1. auth_id로 기존 identity 찾기
  SELECT ui.user_id INTO v_user_id
  FROM user_identities ui
  WHERE ui.auth_id = p_auth_id;

  IF v_user_id IS NOT NULL THEN
    -- 기존 유저 발견 - last_used_at 업데이트
    UPDATE user_identities
    SET last_used_at = NOW(),
        profile = COALESCE(p_profile, profile)
    WHERE auth_id = p_auth_id;

    RETURN QUERY SELECT v_user_id, false, false;
    RETURN;
  END IF;

  -- 2. 이메일로 기존 유저 찾기 (자동 연동)
  IF p_email IS NOT NULL AND p_email NOT LIKE '%@line.local' THEN
    SELECT id INTO v_user_id
    FROM users
    WHERE email = p_email
      AND deleted_at IS NULL;

    IF v_user_id IS NOT NULL THEN
      -- 기존 유저에 새 identity 연결
      INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
      VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile);

      v_is_new_identity := true;
      RETURN QUERY SELECT v_user_id, false, true;
      RETURN;
    END IF;
  END IF;

  -- 3. 전화번호로 기존 유저 찾기
  IF p_phone IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM users
    WHERE phone = p_phone
      AND deleted_at IS NULL;

    IF v_user_id IS NOT NULL THEN
      -- 기존 유저에 새 identity 연결
      INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
      VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile);

      v_is_new_identity := true;
      RETURN QUERY SELECT v_user_id, false, true;
      RETURN;
    END IF;
  END IF;

  -- 4. 완전 신규 유저 생성
  INSERT INTO users (id, user_type, role, email, name, phone)
  VALUES (
    gen_random_uuid(),
    'CUSTOMER',
    'CUSTOMER',
    COALESCE(p_email, p_auth_id::TEXT || '@' || LOWER(p_provider::TEXT) || '.local'),
    COALESCE(p_name, p_profile->>'displayName', p_profile->>'name', 'User'),
    p_phone
  )
  RETURNING id INTO v_user_id;

  -- 새 identity 생성 (primary로)
  INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile, is_primary)
  VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile, true);

  v_is_new_user := true;
  v_is_new_identity := true;

  RETURN QUERY SELECT v_user_id, true, true;
END;
$$;

COMMENT ON FUNCTION find_or_create_user_by_identity IS '소셜 로그인 시 유저 찾기 또는 생성. 이메일/전화번호 매칭으로 자동 연동 지원.';

-- 계정 연동 함수
CREATE OR REPLACE FUNCTION link_identity(
  p_user_id UUID,
  p_auth_id UUID,
  p_provider auth_provider,
  p_provider_user_id TEXT,
  p_profile JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_identity_id UUID;
  v_existing_user_id UUID;
BEGIN
  -- 이미 다른 유저에 연결된 auth_id인지 확인
  SELECT user_id INTO v_existing_user_id
  FROM user_identities
  WHERE auth_id = p_auth_id;

  IF v_existing_user_id IS NOT NULL THEN
    IF v_existing_user_id = p_user_id THEN
      -- 이미 같은 유저에 연결됨
      SELECT id INTO v_identity_id FROM user_identities WHERE auth_id = p_auth_id;
      RETURN v_identity_id;
    ELSE
      -- 다른 유저에 이미 연결됨
      RAISE EXCEPTION 'This social account is already linked to another user';
    END IF;
  END IF;

  -- 같은 유저가 이미 같은 provider를 가지고 있는지 확인
  SELECT id INTO v_identity_id
  FROM user_identities
  WHERE user_id = p_user_id AND provider = p_provider;

  IF v_identity_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a % account linked', p_provider;
  END IF;

  -- 새 identity 생성
  INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
  VALUES (p_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile)
  RETURNING id INTO v_identity_id;

  RETURN v_identity_id;
END;
$$;

COMMENT ON FUNCTION link_identity IS '기존 유저에 새로운 소셜 계정 연동';

-- 계정 연동 해제 함수
CREATE OR REPLACE FUNCTION unlink_identity(
  p_user_id UUID,
  p_provider auth_provider
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_identity_count INT;
  v_is_primary BOOLEAN;
BEGIN
  -- 현재 연결된 identity 개수 확인
  SELECT COUNT(*) INTO v_identity_count
  FROM user_identities
  WHERE user_id = p_user_id;

  IF v_identity_count <= 1 THEN
    RAISE EXCEPTION 'Cannot unlink the last identity. User must have at least one login method.';
  END IF;

  -- 삭제하려는 identity가 primary인지 확인
  SELECT is_primary INTO v_is_primary
  FROM user_identities
  WHERE user_id = p_user_id AND provider = p_provider;

  IF v_is_primary THEN
    -- 다른 identity를 primary로 설정 (1개만)
    UPDATE user_identities
    SET is_primary = true
    WHERE id = (
      SELECT id FROM user_identities
      WHERE user_id = p_user_id AND provider != p_provider
      LIMIT 1
    );
  END IF;

  -- 삭제
  DELETE FROM user_identities
  WHERE user_id = p_user_id AND provider = p_provider;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION unlink_identity IS '소셜 계정 연동 해제 (최소 1개는 유지)';

-- 유저의 연동된 계정 목록 조회
CREATE OR REPLACE FUNCTION get_user_identities(p_user_id UUID)
RETURNS TABLE (
  provider auth_provider,
  provider_user_id TEXT,
  profile JSONB,
  is_primary BOOLEAN,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ui.provider,
    ui.provider_user_id,
    ui.profile,
    ui.is_primary,
    ui.connected_at,
    ui.last_used_at
  FROM user_identities ui
  WHERE ui.user_id = p_user_id
  ORDER BY ui.is_primary DESC, ui.connected_at ASC;
END;
$$;

COMMENT ON FUNCTION get_user_identities IS '유저의 연동된 소셜 계정 목록 조회';
