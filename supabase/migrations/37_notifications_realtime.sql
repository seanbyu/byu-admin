-- ============================================
-- Enable Realtime for notifications table
-- ============================================

-- REPLICA IDENTITY FULL: 변경된 row 전체 데이터를 Realtime으로 전송
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- supabase_realtime publication에 notifications 테이블 추가 (이미 등록된 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
