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

// ─────────────────────────────────────────────
// 지수 백오프: 다음 재시도 시간 계산
// attempt 1→1분, 2→4분, 3→9분, 4→16분, 5→포기
// ─────────────────────────────────────────────
function nextRetryAt(attempt: number): string {
  const delayMinutes = Math.pow(attempt, 2);
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

// ─────────────────────────────────────────────
// notification_outbox 레코드 타입
// ─────────────────────────────────────────────
interface OutboxRecord {
  id:                      string;
  notification_id:         string | null;  // notifications 테이블 FK
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

// ─────────────────────────────────────────────
// LINE Push API 호출
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 메인 핸들러
// ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now      = new Date().toISOString();
  const stats    = { processed: 0, sent: 0, retrying: 0, dead: 0, skipped: 0 };

  // ── 1. pending → sending 원자적 전환 (SKIP LOCKED) ─────────────────
  const { data: claimed, error: claimErr } = await supabase.rpc(
    "claim_outbox_batch",
    { p_limit: BATCH_SIZE },
  );

  if (claimErr) {
    console.error("[process-outbox] claim error:", claimErr);
    return new Response(
      JSON.stringify({ success: false, error: claimErr.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }

  if (!claimed?.length) {
    return new Response(
      JSON.stringify({ success: true, message: "Nothing to process", ...stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── 2. 살롱별 LINE 토큰 캐시 (같은 살롱 여러 건이면 재조회 방지) ────
  const tokenCache = new Map<string, string | null>();

  async function getLineToken(salonId: string): Promise<string | null> {
    if (tokenCache.has(salonId)) return tokenCache.get(salonId) ?? null;
    const { data } = await supabase
      .from("salon_line_settings")
      .select("line_channel_access_token")
      .eq("salon_id",  salonId)
      .eq("is_active", true)
      .single();
    const token = data?.line_channel_access_token ?? null;
    tokenCache.set(salonId, token);
    return token;
  }

  // ── 3. outbox 업데이트 헬퍼 ────────────────────────────────────────
  async function markOutbox(
    id:     string,
    fields: Record<string, unknown>,
  ) {
    await supabase
      .from("notification_outbox")
      .update({ ...fields, updated_at: now })
      .eq("id", id);
  }

  // notifications 테이블 (LINE 로그) 상태도 동기화
  async function markNotification(
    notifId: string | null,
    status:  string,
    extra?:  Record<string, unknown>,
  ) {
    if (!notifId) return;
    await supabase
      .from("notifications")
      .update({ status, ...extra, updated_at: now })
      .eq("id", notifId);
  }

  // ── 4. 각 outbox 레코드 처리 ────────────────────────────────────────
  for (const record of claimed as OutboxRecord[]) {
    stats.processed++;

    try {
      // ── 4-1. LINE 채널 처리 ──────────────────────────────────────
      if (record.channel === "LINE") {

        // LINE user ID 확인
        if (!record.recipient_line_user_id) {
          await markOutbox(record.id, {
            status:     "failed",
            last_error: "recipient_line_user_id is null",
          });
          await markNotification(record.notification_id, "FAILED", {
            error_code:    "NO_LINE_USER_ID",
            error_message: "recipient_line_user_id is null",
          });
          stats.skipped++;
          continue;
        }

        // 살롱 LINE 토큰 조회
        const token = await getLineToken(record.salon_id);
        if (!token) {
          await markOutbox(record.id, {
            status:     "failed",
            last_error: "No active LINE token for salon",
          });
          await markNotification(record.notification_id, "FAILED", {
            error_code:    "NO_LINE_TOKEN",
            error_message: "No active LINE token for salon",
          });
          stats.skipped++;
          continue;
        }

        // LINE Push 발송
        const result = await sendLinePush(
          token,
          record.recipient_line_user_id,
          record.payload.line_message,
        );

        if (result.success) {
          // ── 성공 ──────────────────────────────────────────────────
          await markOutbox(record.id, {
            status:  "sent",
            sent_at: now,
            last_error: null,
          });
          await markNotification(record.notification_id, "SENT", {
            sent_at: now,
          });
          stats.sent++;

        } else {
          // ── 실패 → 재시도 or dead_letter ──────────────────────────
          const newAttempt = record.attempt_count + 1;

          if (newAttempt >= record.max_attempts) {
            await markOutbox(record.id, {
              status:        "dead_letter",
              attempt_count: newAttempt,
              last_error:    result.error,
            });
            await markNotification(record.notification_id, "FAILED", {
              error_code:    "LINE_API_MAX_RETRY",
              error_message: result.error,
              retry_count:   newAttempt,
            });
            stats.dead++;
          } else {
            // 지수 백오프 재시도 예약
            await markOutbox(record.id, {
              status:        "pending",          // claim 풀에 재진입
              attempt_count: newAttempt,
              next_retry_at: nextRetryAt(newAttempt),
              last_error:    result.error,
            });
            stats.retrying++;
          }
        }

      }
      // ── 4-2. 향후 채널 확장 지점 ────────────────────────────────
      // else if (record.channel === "EMAIL") { ... }
      // else if (record.channel === "PUSH")  { ... }

    } catch (err) {
      // 예상치 못한 에러 → 재시도 또는 dead_letter
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
          error_code:    "UNEXPECTED",
          error_message: (err as Error).message,
        });
        stats.dead++;
      } else {
        stats.retrying++;
      }
    }
  }

  console.log("[process-outbox] stats:", JSON.stringify(stats));

  return new Response(
    JSON.stringify({ success: true, ...stats }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
