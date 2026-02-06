-- ============================================
-- Reviews Extended Features (리뷰 기능 확장)
-- ============================================

-- ============================================
-- 1. 세부 평점 추가
-- ============================================
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5);

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5);

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5);

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5);

COMMENT ON COLUMN reviews.service_rating IS '서비스 만족도 (1-5)';
COMMENT ON COLUMN reviews.staff_rating IS '직원 친절도 (1-5)';
COMMENT ON COLUMN reviews.cleanliness_rating IS '청결도 (1-5)';
COMMENT ON COLUMN reviews.value_rating IS '가격 대비 만족도 (1-5)';

-- ============================================
-- 2. 리뷰 태그 추가
-- ============================================
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN reviews.tags IS '리뷰 태그 (예: ["친절해요", "기술이좋아요", "분위기좋아요"])';

-- 태그 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_tags ON reviews USING gin(tags);

-- ============================================
-- 3. 좋아요 수 추가
-- ============================================
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN reviews.likes_count IS '좋아요 수 (캐시)';

-- ============================================
-- 4. 리뷰 좋아요 테이블 (누가 좋아요 했는지)
-- ============================================
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_likes_review ON review_likes(review_id);
CREATE INDEX idx_review_likes_user ON review_likes(user_id);

COMMENT ON TABLE review_likes IS '리뷰 좋아요 기록';

-- ============================================
-- 5. 리뷰 신고 기능
-- ============================================
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'PENDING',     -- 신고 접수
    'REVIEWING',   -- 검토 중
    'RESOLVED',    -- 처리 완료
    'DISMISSED'    -- 기각
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN reviews.is_reported IS '신고된 리뷰 여부';
COMMENT ON COLUMN reviews.report_count IS '신고 횟수';

-- ============================================
-- 6. 리뷰 신고 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 신고 사유
  reason TEXT NOT NULL,
  -- 예: "욕설/비방", "허위 리뷰", "광고성 내용", "개인정보 노출", "기타"

  reason_detail TEXT,  -- 상세 사유

  -- 처리 상태
  status report_status NOT NULL DEFAULT 'PENDING',

  -- 처리 정보
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,  -- 처리 내용

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_review_reports_review ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(status);
CREATE INDEX idx_review_reports_created ON review_reports(created_at DESC);

COMMENT ON TABLE review_reports IS '리뷰 신고 기록';

-- ============================================
-- 7. 리뷰 수정 이력 (선택적)
-- ============================================
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS original_comment TEXT;  -- 수정 전 원본

COMMENT ON COLUMN reviews.is_edited IS '수정된 리뷰 여부';
COMMENT ON COLUMN reviews.edited_at IS '마지막 수정 시간';
COMMENT ON COLUMN reviews.original_comment IS '최초 작성 내용 (수정 시 보관)';

-- ============================================
-- 8. 트리거: 좋아요 수 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET likes_count = likes_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_likes_count ON review_likes;

CREATE TRIGGER trg_review_likes_count
AFTER INSERT OR DELETE ON review_likes
FOR EACH ROW
EXECUTE FUNCTION update_review_likes_count();

-- ============================================
-- 9. 트리거: 신고 수 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_review_report_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET
      report_count = report_count + 1,
      is_reported = true
    WHERE id = NEW.review_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_report_count ON review_reports;

CREATE TRIGGER trg_review_report_count
AFTER INSERT ON review_reports
FOR EACH ROW
EXECUTE FUNCTION update_review_report_count();

-- ============================================
-- 10. RLS Policies
-- ============================================

-- Review Likes
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review likes"
  ON review_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like reviews"
  ON review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON review_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Review Reports
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report reviews"
  ON review_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports"
  ON review_reports FOR SELECT
  USING (auth.uid() = reported_by);

CREATE POLICY "Salon admins can view reports for their salon"
  ON review_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_reports.review_id
      AND r.salon_id = get_my_salon_id()
    )
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

CREATE POLICY "Admins can manage reports"
  ON review_reports FOR UPDATE
  USING (
    get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================
-- 11. Updated_at 트리거
-- ============================================
CREATE TRIGGER update_review_reports_updated_at
BEFORE UPDATE ON review_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
