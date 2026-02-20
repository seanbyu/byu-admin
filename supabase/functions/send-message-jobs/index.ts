/**
 * send-message-jobs
 *
 * 5분마다 실행 (Supabase Scheduled Trigger 또는 pg_cron)
 * pending 상태의 message_jobs를 LINE Push로 발송
 *
 * - 발송 전 최종 검증 (opt_out, line_user_id, 중복, 미래 예약)
 * - LINE Messaging API Push Message 호출
 * - 상태 갱신 (sent / failed / skipped)
 * - message_events에 sent 이벤트 기록
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { buildLineMessage, type JobType, type Locale } from "../_shared/line-templates.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BATCH_SIZE = 200;
const SEND_DELAY_MS = 100; // rate limit 보호: 메시지 간 100ms 딜레이

interface MessageJob {
  id: string;
  salon_id: string;
  customer_id: string;
  booking_id: string | null;
  job_type: JobType;
  scheduled_at: string;
  payload: {
    customer_name: string;
    service_name: string;
    salon_name: string;
    line_user_id: string;
    booking_url: string;
    booking_date?: string;
    booking_time?: string;
    artist_name?: string;
    locale?: string;
  };
  status: string;
}

/**
 * LINE Messaging API Push Message 발송
 */
async function sendLinePush(
  lineChannelAccessToken: string,
  lineUserId: string,
  message: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `LINE API ${response.status}: ${errorBody}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Network error: ${error.message}` };
  }
}

/**
 * 살롱별 LINE 채널 토큰 캐시 (함수 실행 단위)
 */
const tokenCache = new Map<string, string | null>();

async function getLineToken(
  supabase: ReturnType<typeof createClient>,
  salonId: string,
): Promise<string | null> {
  if (tokenCache.has(salonId)) {
    return tokenCache.get(salonId) ?? null;
  }

  const { data } = await supabase
    .from("salon_line_settings")
    .select("line_channel_access_token")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .single();

  const token = data?.line_channel_access_token ?? null;
  tokenCache.set(salonId, token);
  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();
  const stats = { processed: 0, sent: 0, skipped: 0, failed: 0, errors: [] as string[] };

  try {
    // 1. pending jobs 조회 (scheduled_at <= now)
    const { data: jobs, error: fetchErr } = await supabase
      .from("message_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) {
      throw new Error(`Fetch jobs failed: ${fetchErr.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending jobs", ...stats }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 2. 각 job 처리
    for (const job of jobs as MessageJob[]) {
      stats.processed++;

      try {
        // ---- 최종 검증 (재검증) ----
        const skipReason = await validateJob(supabase, job);
        if (skipReason) {
          await supabase
            .from("message_jobs")
            .update({ status: "skipped", error: skipReason })
            .eq("id", job.id);
          stats.skipped++;
          continue;
        }

        // ---- LINE 토큰 획득 ----
        const lineToken = await getLineToken(supabase, job.salon_id);
        if (!lineToken) {
          await supabase
            .from("message_jobs")
            .update({ status: "skipped", error: "No LINE channel token for salon" })
            .eq("id", job.id);
          stats.skipped++;
          continue;
        }

        // ---- 메시지 생성 ----
        const locale = (job.payload.locale as Locale) || "en";
        const message = buildLineMessage(job.job_type, locale, {
          customer_name: job.payload.customer_name,
          service_name: job.payload.service_name,
          salon_name: job.payload.salon_name,
          booking_url: job.payload.booking_url,
          booking_date: job.payload.booking_date,
          booking_time: job.payload.booking_time,
          artist_name: job.payload.artist_name,
        });

        // ---- LINE Push 발송 ----
        const lineResult = await sendLinePush(
          lineToken,
          job.payload.line_user_id,
          message,
        );

        if (lineResult.success) {
          // 성공
          await supabase
            .from("message_jobs")
            .update({ status: "sent", sent_at: now })
            .eq("id", job.id);

          // sent 이벤트 기록
          await supabase
            .from("message_events")
            .insert({
              message_job_id: job.id,
              event_type: "sent",
              event_at: now,
              metadata: { job_type: job.job_type, locale },
            });

          stats.sent++;
        } else {
          // 실패
          await supabase
            .from("message_jobs")
            .update({ status: "failed", error: lineResult.error })
            .eq("id", job.id);
          stats.failed++;
        }

        // rate limit 보호
        await sleep(SEND_DELAY_MS);
      } catch (jobError) {
        await supabase
          .from("message_jobs")
          .update({ status: "failed", error: `Unexpected: ${jobError.message}` })
          .eq("id", job.id);
        stats.failed++;
        stats.errors.push(`Job ${job.id}: ${jobError.message}`);
      }
    }

    console.log("send-message-jobs stats:", JSON.stringify(stats));

    return new Response(
      JSON.stringify({ success: true, ...stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("send-message-jobs error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

/**
 * 발송 전 최종 검증
 * @returns skip 사유 문자열 (null이면 발송 가능)
 */
async function validateJob(
  supabase: ReturnType<typeof createClient>,
  job: MessageJob,
): Promise<string | null> {
  // 1. 고객 정보 확인 (opt_out, line_user_id)
  const { data: customer } = await supabase
    .from("customers")
    .select("opt_out, line_user_id")
    .eq("id", job.customer_id)
    .single();

  if (!customer) return "Customer not found";
  if (customer.opt_out) return "Customer opted out";
  if (!customer.line_user_id) return "No LINE user ID";

  // payload의 line_user_id를 최신 값으로 갱신
  if (customer.line_user_id !== job.payload.line_user_id) {
    job.payload.line_user_id = customer.line_user_id;
  }

  // 2. 동일 customer_id + job_type 최근 14일 내 sent 이력
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentSent } = await supabase
    .from("message_jobs")
    .select("id")
    .eq("customer_id", job.customer_id)
    .eq("job_type", job.job_type)
    .eq("status", "sent")
    .gte("sent_at", fourteenDaysAgo)
    .neq("id", job.id)
    .limit(1);

  if (recentSent && recentSent.length > 0) {
    return `Already sent ${job.job_type} within 14 days`;
  }

  // 3. rebook_* 타입: 미래 예약이 있으면 스킵
  if (job.job_type === "rebook_due" || job.job_type === "rebook_overdue") {
    const today = new Date().toISOString().split("T")[0];
    const { data: futureBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_id", job.customer_id)
      .in("status", ["PENDING", "CONFIRMED"])
      .gte("booking_date", today)
      .limit(1);

    if (futureBooking && futureBooking.length > 0) {
      return "Customer has future booking";
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
