/**
 * NotificationService
 *
 * 예약 이벤트에 따른 알림 트리거를 오케스트레이션합니다.
 * route.ts는 이 서비스만 알면 되며, 개별 트리거 로직을 몰라도 됩니다.
 *
 * 사용 예:
 *   const notifService = new NotificationService(adminClient);
 *   await notifService.onBookingConfirmed(bookingId);
 *   await notifService.onBookingCancelled(bookingId);
 *   await notifService.onBookingChanged(bookingId, updates);
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { triggerBookingConfirmed } from "./triggers/booking-confirmed.trigger";
import { triggerBookingCancelled } from "./triggers/booking-cancelled.trigger";
import { triggerBookingChanged, hasScheduleChange, type BookingUpdates } from "./triggers/booking-changed.trigger";
import type { TriggerResult } from "./types";

export class NotificationService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * 예약 확정 알림
   * - confirm_booking 액션 시 호출
   */
  async onBookingConfirmed(bookingId: string): Promise<TriggerResult> {
    return triggerBookingConfirmed(this.client, bookingId, { isReschedule: false });
  }

  /**
   * 예약 변경 후 재확정 알림
   * - 고객이 일정 변경 요청 → 관리자가 확정 시 호출
   */
  async onBookingChangeConfirmed(bookingId: string): Promise<TriggerResult> {
    return triggerBookingConfirmed(this.client, bookingId, { isReschedule: true });
  }

  /**
   * 예약 취소 알림
   * - cancel_booking 액션 또는 status → CANCELLED 변경 시 호출
   */
  async onBookingCancelled(bookingId: string): Promise<TriggerResult> {
    return triggerBookingCancelled(this.client, bookingId);
  }

  /**
   * 예약 변경 알림 (일정/담당자 변경)
   * - update_booking에서 일정 필드 변경 시 호출
   * - status 변경과 동시에 일어나는 경우 이 트리거는 건너뜀
   */
  async onBookingChanged(
    bookingId: string,
    updates: BookingUpdates,
    options: { skipIfStatusChange?: boolean } = {},
  ): Promise<TriggerResult | null> {
    // 상태 변경이 함께 있으면 상태 트리거가 우선 → 변경 알림 건너뜀
    if (options.skipIfStatusChange && updates.status) {
      return null;
    }

    if (!hasScheduleChange(updates)) {
      return null; // 일정 변경 없음 → 알림 불필요
    }

    return triggerBookingChanged(this.client, bookingId);
  }

  /**
   * update_booking 일괄 처리
   * - status 변경 + 일정 변경이 동시에 오는 케이스를 안전하게 처리
   * - 상태 알림과 일정 변경 알림이 중복 발송되지 않도록 조율
   */
  async onBookingUpdated(
    bookingId: string,
    updates: BookingUpdates,
    bookingMeta?: Record<string, unknown>,
  ): Promise<TriggerResult[]> {
    const results: TriggerResult[] = [];

    // 1. 상태 변경 알림 (우선순위 높음)
    if (updates.status === "CONFIRMED") {
      const isReschedule = bookingMeta?.reschedule_pending === true;
      const result = isReschedule
        ? await this.onBookingChangeConfirmed(bookingId)
        : await this.onBookingConfirmed(bookingId);
      results.push(result);

      // 2. 상태 변경과 함께 일정 변경도 있으면 → 변경 알림은 생략
      return results;
    }

    if (updates.status === "CANCELLED") {
      const result = await this.onBookingCancelled(bookingId);
      results.push(result);
      return results;
    }

    // 3. 상태 변경 없이 일정만 변경된 경우 → 변경 알림 발송
    const changeResult = await this.onBookingChanged(bookingId, updates);
    if (changeResult) results.push(changeResult);

    return results;
  }
}
