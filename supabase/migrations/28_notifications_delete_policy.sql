-- ============================================
-- Notifications DELETE RLS Policy
-- 인증된 사용자가 알림을 삭제할 수 있도록 허용
-- ============================================

CREATE POLICY "Allow authenticated users to delete notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (true);
