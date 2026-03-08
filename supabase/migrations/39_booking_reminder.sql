-- ============================================
-- 39_booking_reminder.sql
--
-- 예약 당일 리마인더 LINE 알림
--   1. notification_type ENUM에 BOOKING_REMINDER 추가
--   2. queue_booking_reminders() 함수 — 오늘 확정 예약 대상 outbox 생성
--   3. pg_cron — 매일 09:00 ICT (02:00 UTC) 자동 실행
-- ============================================

-- ============================================
-- 1. ENUM 추가
-- ============================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'BOOKING_REMINDER';

-- ============================================
-- 2. 리마인더 큐잉 함수
--    오늘 날짜 CONFIRMED 예약 중 리마인더가 아직 없는 건만 처리
-- ============================================
CREATE OR REPLACE FUNCTION queue_booking_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_d       RECORD;
  v_title   TEXT;
  v_body    TEXT;
  v_line_msg JSONB;
  v_ikey    TEXT;
  v_notif_id UUID;
BEGIN
  FOR v_booking IN
    SELECT b.id, b.salon_id
    FROM   bookings b
    WHERE  b.booking_date = CURRENT_DATE
      AND  b.status       = 'CONFIRMED'
      -- 이미 리마인더 큐에 있으면 스킵 (중복 방지)
      AND NOT EXISTS (
        SELECT 1
        FROM   notification_outbox o
        WHERE  o.booking_id        = b.id
          AND  o.notification_type = 'BOOKING_REMINDER'
          AND  o.status           IN ('pending', 'sending', 'sent')
      )
  LOOP
    SELECT * INTO v_d
    FROM get_booking_notification_data(v_booking.id);

    -- LINE 발송 불가 조건 스킵
    IF NOT FOUND
      OR v_d.line_user_id IS NULL
      OR v_d.opt_out
      OR v_d.line_blocked
    THEN
      CONTINUE;
    END IF;

    v_title := COALESCE(v_d.salon_name, '') || ' 예약 당일 안내';
    v_body  := v_d.customer_name
               || '님, 오늘 ' || v_d.start_time || ' '
               || COALESCE(v_d.artist_name, '') || '님과의 '
               || COALESCE(v_d.service_name, '') || ' 예약이 있습니다. 방문 기다리겠습니다!';

    v_line_msg := jsonb_build_object(
      'type', 'text',
      'text', v_title || E'\n\n' || v_body
    );

    v_ikey := v_booking.id::TEXT || ':BOOKING_REMINDER:' || TO_CHAR(NOW(), 'YYYY-MM-DD');

    -- notifications 로그 INSERT
    INSERT INTO notifications (
      salon_id, booking_id,
      recipient_type, recipient_customer_id,
      notification_type, channel,
      title, body,
      metadata, status
    ) VALUES (
      v_booking.salon_id, v_booking.id,
      'CUSTOMER', v_d.customer_id,
      'BOOKING_REMINDER', 'LINE',
      v_title, v_body,
      jsonb_build_object(
        'salon_name',    v_d.salon_name,
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time,
        'formatted_date',v_d.formatted_date
      ),
      'PENDING'
    )
    RETURNING id INTO v_notif_id;

    -- notification_outbox INSERT
    INSERT INTO notification_outbox (
      notification_id,
      salon_id, booking_id,
      channel, notification_type,
      recipient_line_user_id, recipient_customer_id,
      payload,
      idempotency_key,
      status, next_retry_at
    ) VALUES (
      v_notif_id,
      v_booking.salon_id, v_booking.id,
      'LINE', 'BOOKING_REMINDER',
      v_d.line_user_id, v_d.customer_id,
      jsonb_build_object(
        'title',         v_title,
        'body',          v_body,
        'line_message',  v_line_msg,
        'salon_name',    v_d.salon_name,
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time,
        'formatted_date',v_d.formatted_date
      ),
      v_ikey,
      'pending', NOW()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[queue_booking_reminders] error: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION queue_booking_reminders IS
  '오늘 날짜 CONFIRMED 예약 중 LINE 리마인더가 없는 건을 notification_outbox에 큐잉. pg_cron이 매일 09:00 ICT(02:00 UTC) 호출.';

-- ============================================
-- 3. pg_cron 등록 — 매일 09:00 ICT = 02:00 UTC
-- ============================================
SELECT cron.unschedule('queue-booking-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'queue-booking-reminders'
);

SELECT cron.schedule(
  'queue-booking-reminders',
  '0 2 * * *',
  'SELECT queue_booking_reminders()'
);
