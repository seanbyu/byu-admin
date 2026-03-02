/**
 * booking-confirmed.trigger.ts
 *
 * 트리거 조건:
 *   - 관리자가 예약을 확정 (action: confirm_booking)
 *   - update_booking에서 status → CONFIRMED 변경 시
 *
 * 발송 메시지:
 *   - isReschedule=false: "예약이 확정되었습니다"
 *   - isReschedule=true:  "예약 변경이 확정되었습니다"
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { fetchBookingPayload, dispatchNotification } from "./base.trigger";
import type { TriggerResult } from "../types";

export async function triggerBookingConfirmed(
  client: SupabaseClient,
  bookingId: string,
  options: { isReschedule?: boolean } = {},
): Promise<TriggerResult> {
  try {
    const payload = await fetchBookingPayload(client, bookingId);
    if (!payload) {
      return { success: false, notificationIds: [], skippedReason: "Booking not found" };
    }

    const triggerType = options.isReschedule ? "BOOKING_CHANGE_CONFIRMED" : "BOOKING_CONFIRMED";
    return await dispatchNotification(client, payload, triggerType);
  } catch (error) {
    console.error("[triggerBookingConfirmed] error:", error);
    return { success: false, notificationIds: [], error: (error as Error).message };
  }
}
