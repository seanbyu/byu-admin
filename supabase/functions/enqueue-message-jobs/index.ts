/**
 * enqueue-message-jobs
 *
 * 매일 09:00 Asia/Bangkok에 실행 (Supabase Scheduled Trigger 또는 pg_cron)
 * 대상 고객을 산출해 message_jobs에 적재
 *
 * job_type:
 *   rebook_due     - next_due_at - 3일 시점
 *   rebook_overdue - next_due_at + 7일 ~ +21일 (휴면)
 *   reminder_24h   - 예약 24시간 전
 *   reminder_3h    - 예약 3시간 전
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOOKING_BASE_URL = Deno.env.get("BOOKING_BASE_URL") ?? "https://booking.example.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();
  const results = { rebook_due: 0, rebook_overdue: 0, reminder_24h: 0, reminder_3h: 0, errors: [] as string[] };

  try {
    // ============================================
    // 1. rebook_due: next_due_at까지 3일 이내
    // ============================================
    const { data: rebookDueTargets, error: rdErr } = await supabase.rpc(
      "get_rebook_due_targets",
    );

    if (rdErr) {
      results.errors.push(`rebook_due query: ${rdErr.message}`);
    } else if (rebookDueTargets) {
      for (const target of rebookDueTargets) {
        const bookingUrl = `${BOOKING_BASE_URL}/${target.salon_id}?service=${target.service_id}&ref=rebook_due`;
        const { error: insertErr } = await supabase
          .from("message_jobs")
          .upsert(
            {
              salon_id: target.salon_id,
              customer_id: target.customer_id,
              job_type: "rebook_due",
              scheduled_at: now,
              status: "pending",
              payload: {
                customer_name: target.customer_name,
                service_name: target.service_name,
                salon_name: target.salon_name,
                line_user_id: target.line_user_id,
                booking_url: bookingUrl,
                locale: target.locale || "en",
              },
            },
            {
              onConflict: "customer_id,job_type,scheduled_at",
              ignoreDuplicates: true,
            },
          );
        if (insertErr) {
          // unique 위반은 무시, 기타 에러만 기록
          if (!insertErr.message.includes("duplicate")) {
            results.errors.push(`rebook_due insert: ${insertErr.message}`);
          }
        } else {
          results.rebook_due++;
        }
      }
    }

    // ============================================
    // 2. rebook_overdue: next_due_at + 7일 ~ +21일
    // ============================================
    const { data: rebookOverdueTargets, error: roErr } = await supabase.rpc(
      "get_rebook_overdue_targets",
    );

    if (roErr) {
      results.errors.push(`rebook_overdue query: ${roErr.message}`);
    } else if (rebookOverdueTargets) {
      for (const target of rebookOverdueTargets) {
        const bookingUrl = `${BOOKING_BASE_URL}/${target.salon_id}?service=${target.service_id}&ref=rebook_overdue`;
        const { error: insertErr } = await supabase
          .from("message_jobs")
          .upsert(
            {
              salon_id: target.salon_id,
              customer_id: target.customer_id,
              job_type: "rebook_overdue",
              scheduled_at: now,
              status: "pending",
              payload: {
                customer_name: target.customer_name,
                service_name: target.service_name,
                salon_name: target.salon_name,
                line_user_id: target.line_user_id,
                booking_url: bookingUrl,
                locale: target.locale || "en",
              },
            },
            {
              onConflict: "customer_id,job_type,scheduled_at",
              ignoreDuplicates: true,
            },
          );
        if (insertErr && !insertErr.message.includes("duplicate")) {
          results.errors.push(`rebook_overdue insert: ${insertErr.message}`);
        } else if (!insertErr) {
          results.rebook_overdue++;
        }
      }
    }

    // ============================================
    // 3. reminder_24h: 예약 24시간 전 (±15분)
    // ============================================
    const { data: reminder24hTargets, error: r24Err } = await supabase.rpc(
      "get_reminder_24h_targets",
    );

    if (r24Err) {
      results.errors.push(`reminder_24h query: ${r24Err.message}`);
    } else if (reminder24hTargets) {
      for (const target of reminder24hTargets) {
        const bookingUrl = `${BOOKING_BASE_URL}/${target.salon_id}/confirm/${target.booking_id}?ref=reminder_24h`;
        const { error: insertErr } = await supabase
          .from("message_jobs")
          .upsert(
            {
              salon_id: target.salon_id,
              customer_id: target.customer_id,
              booking_id: target.booking_id,
              job_type: "reminder_24h",
              scheduled_at: now,
              status: "pending",
              payload: {
                customer_name: target.customer_name,
                service_name: target.service_name,
                salon_name: target.salon_name,
                line_user_id: target.line_user_id,
                booking_url: bookingUrl,
                booking_date: target.booking_date,
                booking_time: target.booking_time,
                artist_name: target.artist_name,
                locale: target.locale || "en",
              },
            },
            {
              onConflict: "customer_id,job_type,scheduled_at",
              ignoreDuplicates: true,
            },
          );
        if (insertErr && !insertErr.message.includes("duplicate")) {
          results.errors.push(`reminder_24h insert: ${insertErr.message}`);
        } else if (!insertErr) {
          results.reminder_24h++;
        }
      }
    }

    // ============================================
    // 4. reminder_3h: 예약 3시간 전 (±15분)
    // ============================================
    const { data: reminder3hTargets, error: r3Err } = await supabase.rpc(
      "get_reminder_3h_targets",
    );

    if (r3Err) {
      results.errors.push(`reminder_3h query: ${r3Err.message}`);
    } else if (reminder3hTargets) {
      for (const target of reminder3hTargets) {
        const bookingUrl = `${BOOKING_BASE_URL}/${target.salon_id}/confirm/${target.booking_id}?ref=reminder_3h`;
        const { error: insertErr } = await supabase
          .from("message_jobs")
          .upsert(
            {
              salon_id: target.salon_id,
              customer_id: target.customer_id,
              booking_id: target.booking_id,
              job_type: "reminder_3h",
              scheduled_at: now,
              status: "pending",
              payload: {
                customer_name: target.customer_name,
                service_name: target.service_name,
                salon_name: target.salon_name,
                line_user_id: target.line_user_id,
                booking_url: bookingUrl,
                booking_date: target.booking_date,
                booking_time: target.booking_time,
                artist_name: target.artist_name,
                locale: target.locale || "en",
              },
            },
            {
              onConflict: "customer_id,job_type,scheduled_at",
              ignoreDuplicates: true,
            },
          );
        if (insertErr && !insertErr.message.includes("duplicate")) {
          results.errors.push(`reminder_3h insert: ${insertErr.message}`);
        } else if (!insertErr) {
          results.reminder_3h++;
        }
      }
    }

    console.log("enqueue-message-jobs results:", JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("enqueue-message-jobs error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
