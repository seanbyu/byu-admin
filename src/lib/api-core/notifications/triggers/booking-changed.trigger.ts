/**
 * booking-changed.trigger.ts
 *
 * 트리거 조건:
 *   - 관리자가 예약 일정(날짜/시간) 또는 담당자를 변경
 *   - update_booking에서 booking_date | start_time | artist_id 변경 감지
 *
 * 발송 메시지: "예약이 변경되었습니다" (BOOKING_CHANGED)
 *
 * 주의: 상태 변경(CONFIRMED/CANCELLED)과 동시에 일정도 바뀌는 경우
 *       상태 트리거가 우선이므로 이 트리거는 status 변경이 없을 때만 호출
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { fetchBookingPayload, dispatchNotification } from "./base.trigger";
import type { TriggerResult } from "../types";

// 변경을 트리거하는 필드 목록
const SCHEDULE_FIELDS = ["booking_date", "start_time", "end_time", "artist_id"] as const;

export type BookingUpdates = Record<string, unknown>;

/**
 * updates 객체에 일정 관련 변경이 있는지 확인
 */
export function hasScheduleChange(updates: BookingUpdates): boolean {
  return SCHEDULE_FIELDS.some((field) => field in updates);
}

export async function triggerBookingChanged(
  client: SupabaseClient,
  bookingId: string,
): Promise<TriggerResult> {
  try {
    const payload = await fetchBookingPayload(client, bookingId);
    if (!payload) {
      return { success: false, notificationIds: [], skippedReason: "Booking not found" };
    }

    return await dispatchNotification(client, payload, "BOOKING_CHANGED");
  } catch (error) {
    console.error("[triggerBookingChanged] error:", error);
    return { success: false, notificationIds: [], error: (error as Error).message };
  }
}
