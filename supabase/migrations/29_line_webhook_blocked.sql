-- ============================================
-- LINE Webhook: 친구 삭제(블록) 감지를 위한 컬럼 추가
-- ============================================

-- customers 테이블에 line_blocked 컬럼 추가
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS line_blocked BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN customers.line_blocked IS 'LINE 공식계정 차단(친구삭제) 여부 - webhook unfollow 이벤트로 자동 업데이트';

-- line_blocked 인덱스 (발송 시 필터링용)
CREATE INDEX IF NOT EXISTS idx_customers_line_blocked
ON customers(salon_id, line_blocked)
WHERE line_blocked = true;
