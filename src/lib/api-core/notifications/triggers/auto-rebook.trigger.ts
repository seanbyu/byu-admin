/**
 * auto-rebook.trigger.ts
 *
 * 트리거 조건:
 *   - enqueue-message-jobs Edge Function (cron, 매일 09:00 BKK)
 *   - rebook_due: next_due_at - 3일
 *   - rebook_overdue: next_due_at + 7일 ~ +21일 (휴면 고객)
 *
 * 발송 방식: message_jobs 큐에 적재 → send-message-jobs가 처리
 * (즉시 발송이 아닌 큐 기반 — LINE rate limit 대응)
 *
 * 발송 메시지: "다음 방문 시기가 다가왔어요!" (AUTO_REBOOK)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { TriggerResult } from "../types";

export type AutoRebookJobType = "rebook_due" | "rebook_overdue";

export interface AutoRebookTarget {
  salonId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  salonName: string;
  lineUserId: string | null;
  bookingUrl: string;
  locale: string;
}

/**
 * 재예약 유도 job을 message_jobs 큐에 적재
 * (enqueue-message-jobs Edge Function에서 호출)
 */
export async function enqueueAutoRebookJob(
  client: SupabaseClient,
  target: AutoRebookTarget,
  jobType: AutoRebookJobType,
): Promise<TriggerResult> {
  try {
    const scheduledAt = new Date().toISOString();

    const { error } = await client.from("message_jobs").upsert(
      {
        salon_id: target.salonId,
        customer_id: target.customerId,
        job_type: jobType,
        scheduled_at: scheduledAt,
        status: "pending",
        payload: {
          customer_name: target.customerName,
          service_name: target.serviceName,
          salon_name: target.salonName,
          line_user_id: target.lineUserId,
          booking_url: target.bookingUrl,
          locale: target.locale || "en",
          trigger_type: "AUTO_REBOOK",
        },
      },
      {
        onConflict: "customer_id,job_type,scheduled_at",
        ignoreDuplicates: true,
      },
    );

    if (error && !error.message.includes("duplicate")) {
      console.error(`[autoRebookTrigger] enqueue error (${jobType}):`, error);
      return { success: false, notificationIds: [], error: error.message };
    }

    console.log(`[autoRebookTrigger] Enqueued ${jobType} for customer: ${target.customerId}`);
    return { success: true, notificationIds: [] };
  } catch (error) {
    console.error("[autoRebookTrigger] unexpected error:", error);
    return { success: false, notificationIds: [], error: (error as Error).message };
  }
}
