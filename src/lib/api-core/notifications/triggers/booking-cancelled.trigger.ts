/**
 * booking-cancelled.trigger.ts
 *
 * 트리거 조건:
 *   - 관리자가 예약 취소 (action: cancel_booking)
 *   - update_booking에서 status → CANCELLED 변경 시
 *
 * 발송 메시지: "예약이 취소되었습니다" (BOOKING_CANCELLED)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { fetchBookingPayload, dispatchNotification } from "./base.trigger";
import type { TriggerResult } from "../types";

export async function triggerBookingCancelled(
  client: SupabaseClient,
  bookingId: string,
): Promise<TriggerResult> {
  try {
    const payload = await fetchBookingPayload(client, bookingId);
    if (!payload) {
      return { success: false, notificationIds: [], skippedReason: "Booking not found" };
    }

    return await dispatchNotification(client, payload, "BOOKING_CANCELLED");
  } catch (error) {
    console.error("[triggerBookingCancelled] error:", error);
    return { success: false, notificationIds: [], error: (error as Error).message };
  }
}
