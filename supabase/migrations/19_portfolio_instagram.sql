-- ============================================
-- 포트폴리오 및 Instagram 연동 테이블
-- ============================================

-- 포트폴리오 아이템 테이블
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 소스 정보
    source_type VARCHAR(20) NOT NULL DEFAULT 'manual',  -- 'instagram' | 'manual'
    source_id VARCHAR(100),  -- Instagram media ID (중복 방지용)

    -- 이미지 정보
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,

    -- 메타데이터
    caption TEXT,
    tags TEXT[],

    -- 표시 설정
    display_order INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT true,

    -- Instagram 추가 정보
    instagram_permalink TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_portfolio_designer ON portfolio_items(designer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_display_order ON portfolio_items(designer_id, display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_source ON portfolio_items(designer_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_public ON portfolio_items(designer_id, is_public) WHERE is_public = true;

-- Instagram 소스 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_instagram_unique
ON portfolio_items(designer_id, source_id)
WHERE source_type = 'instagram' AND source_id IS NOT NULL;

COMMENT ON TABLE portfolio_items IS '디자이너 포트폴리오 아이템';

-- ============================================
-- Instagram 토큰 저장 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS designer_instagram_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Instagram 정보
    instagram_user_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,

    -- 토큰 만료
    expires_at TIMESTAMPTZ NOT NULL,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(designer_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_tokens_designer ON designer_instagram_tokens(designer_id);
CREATE INDEX IF NOT EXISTS idx_instagram_tokens_expires ON designer_instagram_tokens(expires_at);

COMMENT ON TABLE designer_instagram_tokens IS 'Instagram Long-lived 토큰 저장';

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE designer_instagram_tokens ENABLE ROW LEVEL SECURITY;

-- 포트폴리오: 디자이너 본인만 CRUD
CREATE POLICY "designer_owns_portfolio" ON portfolio_items
    FOR ALL
    USING (designer_id = auth.uid());

-- 포트폴리오: 공개 항목은 누구나 조회 가능
CREATE POLICY "public_portfolio_readable" ON portfolio_items
    FOR SELECT
    USING (is_public = true);

-- Instagram 토큰: 디자이너 본인만 접근
CREATE POLICY "designer_owns_instagram_token" ON designer_instagram_tokens
    FOR ALL
    USING (designer_id = auth.uid());
