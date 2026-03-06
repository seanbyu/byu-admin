-- ============================================
-- 36_customer_inapp_notifications.sql
--
-- 변경:
--   trg_on_booking_status_changed 재정의
--   - 기존: 고객에게 LINE 알림만 생성 (LINE 연동된 경우)
--   - 추가: LINE 연동 여부와 무관하게 고객에게 IN_APP 알림도 생성
--          (CONFIRMED → BOOKING_CONFIRMED / BOOKING_MODIFIED)
--          (CANCELLED → BOOKING_CANCELLED)
-- ============================================

CREATE OR REPLACE FUNCTION trg_on_booking_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_t0              TIMESTAMPTZ := clock_timestamp();
  v_t1              TIMESTAMPTZ;
  v_t2              TIMESTAMPTZ;
  v_d               RECORD;
  v_owner           RECORD;
  v_locale          TEXT;
  v_notif_type      notification_type;
  v_idempotency_key TEXT;
  v_notif_id        UUID;
  v_cancelled_by    TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('CONFIRMED', 'CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- ── 예약 정보 조회 ────────────────────────────────────────────
  SELECT * INTO v_d FROM get_booking_notification_data(NEW.id);

  v_t1 := clock_timestamp();
  RAISE LOG '[perf][trg_status_changed] fetch=%.1fms booking=%',
    EXTRACT(EPOCH FROM (v_t1 - v_t0)) * 1000, NEW.id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- ── locale + 알림 타입 결정 ───────────────────────────────────
  v_locale       := COALESCE(NEW.booking_meta->>'locale', 'ko');
  v_cancelled_by := COALESCE(NEW.booking_meta->>'cancelled_by', 'CUSTOMER');

  IF NEW.status = 'CONFIRMED' THEN
    IF COALESCE((NEW.booking_meta->>'reschedule_pending')::boolean, false) THEN
      v_notif_type := 'BOOKING_MODIFIED';
    ELSE
      v_notif_type := 'BOOKING_CONFIRMED';
    END IF;
  ELSE
    v_notif_type := 'BOOKING_CANCELLED';
  END IF;

  v_t2 := clock_timestamp();

  -- ── LINE 발송: notifications + outbox 원자적 생성 ──────────
  IF v_d.line_user_id IS NOT NULL AND NOT v_d.opt_out AND NOT v_d.line_blocked THEN

    INSERT INTO notifications (
      salon_id, booking_id,
      recipient_type, recipient_customer_id,
      notification_type, channel,
      title, body, metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id,
      'CUSTOMER', v_d.customer_id,
      v_notif_type, 'LINE',
      v_notif_type::TEXT,
      v_notif_type::TEXT,
      jsonb_build_object(
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time
      ),
      'PENDING'
    )
    RETURNING id INTO v_notif_id;

    RAISE LOG '[perf][trg_status_changed] line_notif_insert=%.1fms booking=%',
      EXTRACT(EPOCH FROM (clock_timestamp() - v_t2)) * 1000, NEW.id;

    v_idempotency_key :=
      NEW.id::TEXT || ':' || v_notif_type::TEXT || ':' || TO_CHAR(NOW(), 'YYYY-MM-DD');

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
      NEW.salon_id, NEW.id,
      'LINE', v_notif_type,
      v_d.line_user_id, v_d.customer_id,
      jsonb_build_object(
        'locale',         v_locale,
        'salon_name',     v_d.salon_name,
        'customer_name',  v_d.customer_name,
        'artist_name',    v_d.artist_name,
        'service_name',   v_d.service_name,
        'formatted_date', v_d.formatted_date,
        'booking_date',   v_d.booking_date,
        'start_time',     v_d.start_time
      ),
      v_idempotency_key,
      'pending', NOW()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

  END IF;

  -- ── 고객 IN_APP 알림 생성 (LINE 연동 여부 무관) ────────────
  -- 고객이 byu-web 앱에서 확정/취소 알림을 볼 수 있도록 항상 생성
  IF v_d.customer_id IS NOT NULL THEN
    INSERT INTO notifications (
      salon_id, booking_id,
      recipient_type, recipient_customer_id,
      notification_type, channel,
      title, body, metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id,
      'CUSTOMER', v_d.customer_id,
      v_notif_type, 'IN_APP',
      v_notif_type::TEXT,
      v_notif_type::TEXT,
      jsonb_build_object(
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time,
        'salon_name',    v_d.salon_name
      ),
      'SENT'  -- IN_APP은 DB 저장 자체가 전달이므로 즉시 SENT
    );
  END IF;

  -- ── 취소 시 어드민 IN_APP 알림 생성 ──────────────────────────
  -- 어드민이 직접 취소(cancelled_by = 'ADMIN')는 알림 생성 안 함
  -- 고객이 취소(cancelled_by = 'CUSTOMER' or 없음)만 어드민에게 알림
  IF NEW.status = 'CANCELLED' AND v_cancelled_by != 'ADMIN' THEN
    FOR v_owner IN
      SELECT sp.user_id
      FROM   staff_profiles sp
      WHERE  sp.salon_id = NEW.salon_id
        AND  sp.is_owner = true
    LOOP
      INSERT INTO notifications (
        salon_id, booking_id,
        recipient_type, recipient_user_id,
        notification_type, channel,
        title, body, metadata, status
      ) VALUES (
        NEW.salon_id, NEW.id,
        'ADMIN', v_owner.user_id,
        'BOOKING_CANCELLED', 'IN_APP',
        'BOOKING_CANCELLED',
        'BOOKING_CANCELLED',
        jsonb_build_object(
          'artist_name',   v_d.artist_name,
          'customer_name', v_d.customer_name,
          'service_name',  v_d.service_name,
          'booking_date',  v_d.booking_date,
          'start_time',    v_d.start_time,
          'cancelled_by',  v_cancelled_by
        ),
        'PENDING'
      );
    END LOOP;
  END IF;

  RAISE LOG '[perf][trg_status_changed] total=%.1fms status=% booking=%',
    EXTRACT(EPOCH FROM (clock_timestamp() - v_t0)) * 1000,
    NEW.status, NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[trg_status_changed] ERROR booking=% err=%', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
