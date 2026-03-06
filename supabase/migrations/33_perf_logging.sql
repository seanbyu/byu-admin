-- ============================================
-- 33_perf_logging.sql
--
-- 목표: 알림 시스템 병목 측정 + 성능 최적화
--
-- 변경:
--   1. claim_outbox_batch — PL/pgSQL 전환 + 타이밍 로그
--   2. 성능 최적화용 복합 인덱스 3개 추가
--
-- trg_on_booking_status_changed 는 34_booking_cancelled_admin_notification.sql 에서 정의
-- ============================================


-- ============================================
-- 1. claim_outbox_batch — PL/pgSQL 전환 + 타이밍
--    (process-outbox Edge Function이 호출하는 RPC)
-- ============================================
CREATE OR REPLACE FUNCTION claim_outbox_batch(p_limit INT DEFAULT 20)
RETURNS SETOF notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_t0      TIMESTAMPTZ := clock_timestamp();
  v_count   INT;
BEGIN
  RETURN QUERY
    UPDATE notification_outbox
    SET
      status     = 'sending',
      updated_at = NOW()
    WHERE id IN (
      SELECT id
      FROM   notification_outbox
      WHERE  status        = 'pending'
        AND  next_retry_at <= NOW()
      ORDER  BY next_retry_at ASC
      LIMIT  p_limit
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE LOG '[perf][claim_outbox_batch] claimed=% duration=%.1fms',
    v_count,
    EXTRACT(EPOCH FROM (clock_timestamp() - v_t0)) * 1000;
END;
$$;

-- 권한 재부여 (migration 32에서 revoke 했으므로)
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM anon;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION claim_outbox_batch(INT) TO service_role;


-- ============================================
-- 2. 성능 최적화용 복합 인덱스 추가
-- ============================================

-- isDuplicateNotification 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_notifications_dup_check
  ON notifications(booking_id, notification_type, channel, created_at DESC)
  WHERE booking_id IS NOT NULL;

-- 어드민 알림 목록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notifications_admin_inbox
  ON notifications(salon_id, channel, recipient_type, created_at DESC)
  WHERE channel = 'IN_APP' AND recipient_type = 'ADMIN';

-- staff_profiles 오너 조회 최적화
CREATE INDEX IF NOT EXISTS idx_staff_profiles_salon_owner
  ON staff_profiles(salon_id, is_owner)
  WHERE is_owner = true;
