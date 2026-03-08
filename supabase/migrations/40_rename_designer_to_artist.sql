-- Migration 40: Rename designer_id → artist_id in portfolio_items
-- portfolio_items 테이블의 designer_id 컬럼을 artist_id로 변경

ALTER TABLE portfolio_items
  RENAME COLUMN designer_id TO artist_id;

-- 관련 인덱스 재생성 (기존 인덱스가 있다면 자동 갱신되지만 명시적으로 처리)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'portfolio_items'
    AND indexname = 'portfolio_items_designer_id_idx'
  ) THEN
    ALTER INDEX portfolio_items_designer_id_idx RENAME TO portfolio_items_artist_id_idx;
  END IF;
END $$;
