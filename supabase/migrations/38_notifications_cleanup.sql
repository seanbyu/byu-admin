-- ============================================
-- Notifications 자동 삭제 (1일 경과 후)
-- ============================================

-- pg_cron 확장 활성화 (Supabase 대시보드에서 이미 활성화된 경우 무시)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1일 이상 지난 알림을 삭제하는 함수
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$;

-- 매일 새벽 3시(UTC)에 실행되는 cron job 등록
-- 이미 동일한 jobname이 있으면 먼저 제거 후 재등록
SELECT cron.unschedule('delete-old-notifications')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'delete-old-notifications'
);

SELECT cron.schedule(
  'delete-old-notifications',     -- job 이름
  '0 3 * * *',                    -- 매일 03:00 UTC (한국시간 12:00)
  'SELECT delete_old_notifications()'
);
