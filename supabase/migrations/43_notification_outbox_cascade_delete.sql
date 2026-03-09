-- notifications + notification_outbox: booking_id FK ON DELETE SET NULL → ON DELETE CASCADE
-- 예약 삭제 시 관련 알림 및 outbox 레코드도 함께 삭제

-- 1. notifications 테이블
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_booking_id_fkey;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_booking_id_fkey
  FOREIGN KEY (booking_id)
  REFERENCES bookings(id)
  ON DELETE CASCADE;

-- 2. notification_outbox 테이블
ALTER TABLE notification_outbox
  DROP CONSTRAINT IF EXISTS notification_outbox_booking_id_fkey;

ALTER TABLE notification_outbox
  ADD CONSTRAINT notification_outbox_booking_id_fkey
  FOREIGN KEY (booking_id)
  REFERENCES bookings(id)
  ON DELETE CASCADE;
