/**
 * process-outbox
 *
 * notification_outbox 테이블을 폴링하여 LINE 메시지를 신뢰성 있게 발송합니다.
 *
 * 핵심 보장:
 *   - claim_outbox_batch RPC(FOR UPDATE SKIP LOCKED) 로 동시 처리 방지
 *   - idempotency_key 로 중복 발송 방지 (DB UNIQUE 제약)
 *   - 지수 백오프 재시도 (1 → 4 → 9 → 16분, 최대 5회)
 *   - 성공/실패 모두 notifications 테이블(로그)에 반영
 *
 * 호출 방식:
 *   1. Supabase Cron (pg_cron): 1분마다 자동 실행
 *   2. 수동: POST /functions/v1/process-outbox
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BATCH_SIZE = 20;

// ── 콜드 스타트 감지 ────────────────────────────────────────────
const isColdStart = !(globalThis as unknown as Record<string, unknown>).__outboxWarmed;
if (!(globalThis as unknown as Record<string, unknown>).__outboxWarmed) {
  (globalThis as unknown as Record<string, unknown>).__outboxWarmed = true;
}

function nextRetryAt(attempt: number): string {
  const delayMinutes = Math.pow(attempt, 2);
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

interface OutboxRecord {
  id:                      string;
  notification_id:         string | null;
  salon_id:                string;
  booking_id:              string | null;
  channel:                 string;
  notification_type:       string;
  recipient_line_user_id:  string | null;
  recipient_customer_id:   string | null;
  payload: {
    title:        string;
    body:         string;
    line_message: { type: string; text: string };
    [key: string]: unknown;
  };
  attempt_count: number;
  max_attempts:  number;
}

async function sendLinePush(
  token:      string,
  lineUserId: string,
  message:    Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [message] }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `LINE API ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `Network error: ${(err as Error).message}` };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const fnStart = performance.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now      = new Date().toISOString();
  const stats    = { processed: 0, sent: 0, retrying: 0, dead: 0, skipped: 0 };

  // 레코드별 타이밍 누적
  const timing = { tokenMs: 0, lineApiMs: 0, dbWriteMs: 0 };
  let tokenCacheMisses = 0;

  // ── 1. pending → sending 원자적 전환 (SKIP LOCKED) ─────────────────
  const claimStart = performance.now();
  const { data: claimed, error: claimErr } = await supabase.rpc(
    "claim_outbox_batch",
    { p_limit: BATCH_SIZE },
  );
  const claimMs = performance.now() - claimStart;

  if (claimErr) {
    console.error(JSON.stringify({
      layer: "edge-fn", operation: "process-outbox", isColdStart,
      claimMs: +claimMs.toFixed(1), error: claimErr.message,
    }));
    return new Response(
      JSON.stringify({ success: false, error: claimErr.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }

  if (!claimed?.length) {
    console.log(JSON.stringify({
      layer: "edge-fn", operation: "process-outbox", isColdStart,
      claimMs: +claimMs.toFixed(1),
      totalMs: +(performance.now() - fnStart).toFixed(1),
      message: "Nothing to process",
    }));
    return new Response(
      JSON.stringify({ success: true, message: "Nothing to process", ...stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── 2. 살롱별 LINE 토큰 캐시 (같은 살롱 여러 건이면 재조회 방지) ────
  const tokenCache = new Map<string, string | null>();

  async function getLineToken(salonId: string): Promise<{ token: string | null; cacheHit: boolean }> {
    if (tokenCache.has(salonId)) return { token: tokenCache.get(salonId) ?? null, cacheHit: true };
    const { data } = await supabase
      .from("salon_line_settings")
      .select("line_channel_access_token")
      .eq("salon_id",  salonId)
      .eq("is_active", true)
      .single();
    const token = data?.line_channel_access_token ?? null;
    tokenCache.set(salonId, token);
    return { token, cacheHit: false };
  }

  // ── 3. outbox 업데이트 헬퍼 ────────────────────────────────────────
  async function markOutbox(id: string, fields: Record<string, unknown>) {
    await supabase.from("notification_outbox").update({ ...fields, updated_at: now }).eq("id", id);
  }

  async function markNotification(notifId: string | null, status: string, extra?: Record<string, unknown>) {
    if (!notifId) return;
    await supabase.from("notifications").update({ status, ...extra, updated_at: now }).eq("id", notifId);
  }

  // ── 4. 각 outbox 레코드 처리 ────────────────────────────────────────
  for (const record of claimed as OutboxRecord[]) {
    stats.processed++;
    const recordStart = performance.now();

    try {
      // ── 4-1. LINE 채널 처리 ──────────────────────────────────────
      if (record.channel === "LINE") {

        if (!record.recipient_line_user_id) {
          await markOutbox(record.id, { status: "failed", last_error: "recipient_line_user_id is null" });
          await markNotification(record.notification_id, "FAILED", {
            error_code: "NO_LINE_USER_ID", error_message: "recipient_line_user_id is null",
          });
          stats.skipped++;
          continue;
        }

        // 살롱 LINE 토큰 조회
        const tokenStart = performance.now();
        const { token, cacheHit } = await getLineToken(record.salon_id);
        timing.tokenMs += performance.now() - tokenStart;
        if (!cacheHit) tokenCacheMisses++;

        if (!token) {
          await markOutbox(record.id, { status: "failed", last_error: "No active LINE token for salon" });
          await markNotification(record.notification_id, "FAILED", {
            error_code: "NO_LINE_TOKEN", error_message: "No active LINE token for salon",
          });
          stats.skipped++;
          continue;
        }

        // LINE Push 발송
        const lineApiStart = performance.now();
        const result = await sendLinePush(token, record.recipient_line_user_id, record.payload.line_message);
        const recordLineApiMs = performance.now() - lineApiStart;
        timing.lineApiMs += recordLineApiMs;

        // DB 업데이트
        const dbWriteStart = performance.now();
        if (result.success) {
          await markOutbox(record.id, { status: "sent", sent_at: now, last_error: null });
          await markNotification(record.notification_id, "SENT", { sent_at: now });
          stats.sent++;
        } else {
          const newAttempt = record.attempt_count + 1;
          if (newAttempt >= record.max_attempts) {
            await markOutbox(record.id, { status: "dead_letter", attempt_count: newAttempt, last_error: result.error });
            await markNotification(record.notification_id, "FAILED", {
              error_code: "LINE_API_MAX_RETRY", error_message: result.error, retry_count: newAttempt,
            });
            stats.dead++;
          } else {
            await markOutbox(record.id, {
              status: "pending", attempt_count: newAttempt,
              next_retry_at: nextRetryAt(newAttempt), last_error: result.error,
            });
            stats.retrying++;
          }
        }
        timing.dbWriteMs += performance.now() - dbWriteStart;

        // 레코드 단위 느린 경우 경고
        const recordMs = performance.now() - recordStart;
        if (recordMs > 3000) {
          console.warn(JSON.stringify({
            layer: "edge-fn", operation: "slow-outbox-record",
            id: record.id, recordMs: +recordMs.toFixed(1),
            lineApiMs: +recordLineApiMs.toFixed(1),
          }));
        }
      }
      // ── 4-2. 향후 채널 확장 지점 ────────────────────────────────
      // else if (record.channel === "EMAIL") { ... }

    } catch (err) {
      const newAttempt = record.attempt_count + 1;
      const isDead     = newAttempt >= record.max_attempts;

      await markOutbox(record.id, {
        status:        isDead ? "dead_letter" : "pending",
        attempt_count: newAttempt,
        next_retry_at: isDead ? undefined : nextRetryAt(newAttempt),
        last_error:    (err as Error).message,
      });

      if (isDead) {
        await markNotification(record.notification_id, "FAILED", {
          error_code: "UNEXPECTED", error_message: (err as Error).message,
        });
        stats.dead++;
      } else {
        stats.retrying++;
      }
    }
  }

  // ── 5. 최종 타이밍 요약 ──────────────────────────────────────
  const totalMs = performance.now() - fnStart;
  const n = stats.processed || 1;

  console.log(JSON.stringify({
    layer: "edge-fn",
    operation: "process-outbox",
    isColdStart,
    totalMs:  +totalMs.toFixed(1),
    claimMs:  +claimMs.toFixed(1),
    breakdown: {
      tokenMs:      +(timing.tokenMs / n).toFixed(1),    // 레코드당 평균
      lineApiMs:    +(timing.lineApiMs / n).toFixed(1),
      dbWriteMs:    +(timing.dbWriteMs / n).toFixed(1),
      avgPerRecord: +((totalMs - claimMs) / n).toFixed(1),
    },
    tokenCacheMisses,
    stats,
  }));

  return new Response(
    JSON.stringify({ success: true, ...stats }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
