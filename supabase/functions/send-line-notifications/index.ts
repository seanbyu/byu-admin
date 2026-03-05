/**
 * send-line-notifications
 *
 * notifications 테이블에서 channel='LINE', status='PENDING' 레코드를
 * LINE Push API로 발송하는 Edge Function.
 *
 * 호출 방식:
 *   1. 즉시 호출: body에 { notification_ids: [uuid, ...] } 전달 → 해당 건만 처리
 *   2. 스윕 호출: body 없이 호출 → 전체 PENDING LINE 알림 처리 (cron 등)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BATCH_SIZE = 50;
const SEND_DELAY_MS = 100;

// ── 콜드 스타트 감지 ────────────────────────────────────────────
const isColdStart = !(globalThis as unknown as Record<string, unknown>).__warmed;
if (!(globalThis as unknown as Record<string, unknown>).__warmed) {
  (globalThis as unknown as Record<string, unknown>).__warmed = true;
}

interface PendingNotification {
  id: string;
  salon_id: string;
  booking_id: string | null;
  notification_type: string;
  recipient_type: string;
  recipient_customer_id: string | null;
  recipient_user_id: string | null;
  title: string | null;
  body: string;
  metadata: Record<string, unknown> | null;
  retry_count: number;
  max_retries: number;
}

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
    return { success: false, error: `Network error: ${(error as Error).message}` };
  }
}

const tokenCache = new Map<string, string | null>();

async function getLineToken(
  supabase: ReturnType<typeof createClient>,
  salonId: string,
): Promise<{ token: string | null; cacheHit: boolean }> {
  if (tokenCache.has(salonId)) {
    return { token: tokenCache.get(salonId) ?? null, cacheHit: true };
  }

  const { data } = await supabase
    .from("salon_line_settings")
    .select("line_channel_access_token")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .single();

  const token = data?.line_channel_access_token ?? null;
  tokenCache.set(salonId, token);
  return { token, cacheHit: false };
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  id: string,
  errorCode: string,
  errorMessage?: string,
) {
  await supabase
    .from("notifications")
    .update({
      status: "FAILED",
      error_code: errorCode,
      error_message: errorMessage || null,
    })
    .eq("id", id);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const fnStart = performance.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();

  const stats = {
    processed: 0, sent: 0, skipped: 0, failed: 0,
    errors: [] as string[],
  };
  const skipReasons: Record<string, number> = {};
  let tokenCacheMisses = 0;

  // 레코드별 타이밍 누적 (평균 계산용)
  const timing = {
    fetchMs: 0,
    customerMs: 0,
    tokenMs: 0,
    lineApiMs: 0,
    updateMs: 0,
  };

  try {
    // ── 1. body 파싱 ─────────────────────────────────────────────
    let specificIds: string[] | null = null;
    try {
      const body = await req.json();
      if (body?.notification_ids && Array.isArray(body.notification_ids)) {
        specificIds = body.notification_ids;
      }
    } catch {
      // body 없음 → 전체 PENDING 처리
    }

    // ── 2. PENDING LINE 알림 조회 ─────────────────────────────────
    const fetchStart = performance.now();
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("channel", "LINE")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (specificIds && specificIds.length > 0) {
      query = query.in("id", specificIds);
    }

    const { data: notifications, error: fetchErr } = await query;
    timing.fetchMs = performance.now() - fetchStart;

    if (fetchErr) {
      throw new Error(`Fetch notifications failed: ${fetchErr.message}`);
    }

    if (!notifications || notifications.length === 0) {
      console.log(JSON.stringify({
        layer: "edge-fn", operation: "send-line-notifications",
        isColdStart, totalMs: +(performance.now() - fnStart).toFixed(1),
        fetchMs: +timing.fetchMs.toFixed(1),
        message: "No pending LINE notifications", stats,
      }));
      return new Response(
        JSON.stringify({ success: true, message: "No pending LINE notifications", ...stats }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ── 3. 각 알림 처리 ───────────────────────────────────────────
    for (const notif of notifications as PendingNotification[]) {
      stats.processed++;
      const recordStart = performance.now();

      try {
        // 3-1. LINE user ID 조회
        let lineUserId: string | null = null;

        if (notif.recipient_type === "CUSTOMER" && notif.recipient_customer_id) {
          const customerStart = performance.now();
          const { data: customer } = await supabase
            .from("customers")
            .select("line_user_id, opt_out, line_blocked")
            .eq("id", notif.recipient_customer_id)
            .single();
          timing.customerMs += performance.now() - customerStart;

          if (!customer) {
            await markFailed(supabase, notif.id, "CUSTOMER_NOT_FOUND", "Customer not found");
            skipReasons["CUSTOMER_NOT_FOUND"] = (skipReasons["CUSTOMER_NOT_FOUND"] ?? 0) + 1;
            stats.skipped++;
            continue;
          }
          if (customer.opt_out) {
            await markFailed(supabase, notif.id, "OPT_OUT", "Customer opted out");
            skipReasons["OPT_OUT"] = (skipReasons["OPT_OUT"] ?? 0) + 1;
            stats.skipped++;
            continue;
          }
          if (customer.line_blocked) {
            await markFailed(supabase, notif.id, "LINE_BLOCKED", "Customer has blocked LINE account");
            skipReasons["LINE_BLOCKED"] = (skipReasons["LINE_BLOCKED"] ?? 0) + 1;
            stats.skipped++;
            continue;
          }
          if (!customer.line_user_id) {
            await markFailed(supabase, notif.id, "NO_LINE_ID", "Customer has no LINE user ID");
            skipReasons["NO_LINE_ID"] = (skipReasons["NO_LINE_ID"] ?? 0) + 1;
            stats.skipped++;
            continue;
          }
          lineUserId = customer.line_user_id;
        } else {
          await markFailed(supabase, notif.id, "UNSUPPORTED_RECIPIENT", `LINE push not supported for ${notif.recipient_type}`);
          skipReasons["UNSUPPORTED_RECIPIENT"] = (skipReasons["UNSUPPORTED_RECIPIENT"] ?? 0) + 1;
          stats.skipped++;
          continue;
        }

        // 3-2. 살롱 LINE 토큰 조회
        const tokenStart = performance.now();
        const { token: lineToken, cacheHit } = await getLineToken(supabase, notif.salon_id);
        timing.tokenMs += performance.now() - tokenStart;
        if (!cacheHit) tokenCacheMisses++;

        if (!lineToken) {
          await markFailed(supabase, notif.id, "NO_TOKEN", "No active LINE channel token for salon");
          skipReasons["NO_TOKEN"] = (skipReasons["NO_TOKEN"] ?? 0) + 1;
          stats.skipped++;
          continue;
        }

        // 3-3. LINE 메시지 생성
        const messageText = notif.title
          ? `${notif.title}\n\n${notif.body}`
          : notif.body;
        const message = { type: "text", text: messageText };

        // 3-4. LINE Push 발송
        const lineApiStart = performance.now();
        const result = await sendLinePush(lineToken, lineUserId!, message);
        const recordLineApiMs = performance.now() - lineApiStart;
        timing.lineApiMs += recordLineApiMs;

        // 3-5. notifications 상태 업데이트
        const updateStart = performance.now();
        if (result.success) {
          await supabase
            .from("notifications")
            .update({ status: "SENT", sent_at: now })
            .eq("id", notif.id);
          stats.sent++;
        } else {
          if (notif.retry_count < notif.max_retries) {
            await supabase
              .from("notifications")
              .update({ retry_count: notif.retry_count + 1, error_message: result.error })
              .eq("id", notif.id);
          } else {
            await markFailed(supabase, notif.id, "LINE_API_ERROR", result.error);
          }
          stats.failed++;
        }
        timing.updateMs += performance.now() - updateStart;

        // 레코드 단위 느린 경우 경고
        const recordMs = performance.now() - recordStart;
        if (recordMs > 2000) {
          console.warn(JSON.stringify({
            layer: "edge-fn", operation: "slow-record",
            id: notif.id, recordMs: +recordMs.toFixed(1),
            lineApiMs: +recordLineApiMs.toFixed(1),
          }));
        }

        await sleep(SEND_DELAY_MS);
      } catch (err) {
        await markFailed(supabase, notif.id, "UNEXPECTED", (err as Error).message);
        stats.failed++;
        stats.errors.push(`Notif ${notif.id}: ${(err as Error).message}`);
      }
    }

    // ── 4. 최종 타이밍 요약 ──────────────────────────────────────
    const totalMs = performance.now() - fnStart;
    const n = stats.processed || 1;

    console.log(JSON.stringify({
      layer: "edge-fn",
      operation: "send-line-notifications",
      isColdStart,
      totalMs: +totalMs.toFixed(1),
      breakdown: {
        fetchMs:       +timing.fetchMs.toFixed(1),
        customerMs:    +(timing.customerMs / n).toFixed(1),   // 레코드당 평균
        tokenMs:       +(timing.tokenMs / n).toFixed(1),
        lineApiMs:     +(timing.lineApiMs / n).toFixed(1),
        updateMs:      +(timing.updateMs / n).toFixed(1),
        avgPerRecord:  +((totalMs - timing.fetchMs) / n).toFixed(1),
      },
      tokenCacheMisses,
      stats,
      skipReasons,
    }));

    return new Response(
      JSON.stringify({ success: true, ...stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error(JSON.stringify({
      layer: "edge-fn", operation: "send-line-notifications",
      isColdStart, totalMs: +(performance.now() - fnStart).toFixed(1),
      error: (error as Error).message,
    }));
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
