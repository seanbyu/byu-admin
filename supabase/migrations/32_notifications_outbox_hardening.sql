-- ============================================
-- 32_notifications_outbox_hardening.sql
--
-- 목표:
--  1) notifications RLS 최소권한
--  2) claim_outbox_batch RPC 실행권한 최소화
-- ============================================

-- ============================================
-- 1. notifications RLS 최소권한 재구성
-- ============================================
DROP POLICY IF EXISTS "enable_select_for_all" ON notifications;
DROP POLICY IF EXISTS "Salon staff can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Customers can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON notifications;
DROP POLICY IF EXISTS "Salon staff can create notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to update notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to delete notifications" ON notifications;

DROP POLICY IF EXISTS "notifications_staff_select" ON notifications;
DROP POLICY IF EXISTS "notifications_customer_select" ON notifications;
DROP POLICY IF EXISTS "notifications_no_direct_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_staff_update" ON notifications;
DROP POLICY IF EXISTS "notifications_customer_update" ON notifications;
DROP POLICY IF EXISTS "notifications_staff_delete" ON notifications;

-- 스태프: 자기 살롱 + 관리자성 수신자 알림만 조회
CREATE POLICY "notifications_staff_select"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    salon_id = get_my_salon_id()
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  );

-- 고객: 본인(customer_id 매핑) 알림만 조회
CREATE POLICY "notifications_customer_select"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_customer_id IN (
      SELECT c.id
      FROM customers c
      WHERE c.user_id = auth.uid()
    )
  );

-- 클라이언트 직접 INSERT 금지 (트리거/서비스롤만 생성)
CREATE POLICY "notifications_no_direct_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 스태프: 자기 살롱 IN_APP 알림만 업데이트(읽음 처리)
CREATE POLICY "notifications_staff_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    salon_id = get_my_salon_id()
    AND channel = 'IN_APP'
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  )
  WITH CHECK (
    salon_id = get_my_salon_id()
    AND channel = 'IN_APP'
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  );

-- 고객: 본인 알림만 업데이트(읽음 처리)
CREATE POLICY "notifications_customer_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_customer_id IN (
      SELECT c.id
      FROM customers c
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    recipient_customer_id IN (
      SELECT c.id
      FROM customers c
      WHERE c.user_id = auth.uid()
    )
  );

-- 스태프: 자기 살롱 IN_APP 알림만 삭제
CREATE POLICY "notifications_staff_delete"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    salon_id = get_my_salon_id()
    AND channel = 'IN_APP'
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  );


-- ============================================
-- 2. claim_outbox_batch RPC 실행권한 최소화
-- ============================================
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM anon;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION claim_outbox_batch(INT) TO service_role;
