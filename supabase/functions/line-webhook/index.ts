/**
 * line-webhook
 *
 * LINE Messaging API Webhook 수신 Edge Function.
 * follow / unfollow 이벤트를 처리하여 customers.line_blocked 상태를 관리한다.
 *
 * Webhook URL 설정 (LINE Developers Console):
 *   https://<project>.supabase.co/functions/v1/line-webhook?salon_id=<salon_uuid>
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * LINE Webhook 서명 검증
 * X-Line-Signature 헤더를 channel secret으로 HMAC-SHA256 검증
 */
async function verifySignature(
  body: string,
  signature: string,
  channelSecret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

interface LineEvent {
  type: string;
  source: {
    type: string;
    userId?: string;
  };
  timestamp: number;
  replyToken?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // GET 요청 = LINE Webhook URL 검증 (설정 시 LINE이 GET으로 확인)
  if (req.method === "GET") {
    return new Response("OK", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200,
    });
  }

  const url = new URL(req.url);
  const salonId = url.searchParams.get("salon_id");

  if (!salonId) {
    console.error("[line-webhook] Missing salon_id query parameter");
    return new Response(
      JSON.stringify({ error: "salon_id is required" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. 살롱 LINE 설정에서 channel secret 조회
    const { data: lineSettings, error: settingsErr } = await supabase
      .from("salon_line_settings")
      .select("line_channel_secret")
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .single();

    if (settingsErr || !lineSettings?.line_channel_secret) {
      console.error("[line-webhook] No LINE settings for salon:", salonId, settingsErr);
      return new Response(
        JSON.stringify({ error: "LINE settings not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // 2. 서명 검증
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    const isValid = await verifySignature(bodyText, signature, lineSettings.line_channel_secret);
    if (!isValid) {
      console.error("[line-webhook] Invalid signature for salon:", salonId);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    // 3. 이벤트 처리
    const payload = JSON.parse(bodyText);
    const events: LineEvent[] = payload.events || [];

    const stats = { processed: 0, followed: 0, unfollowed: 0, skipped: 0 };

    for (const event of events) {
      stats.processed++;
      const lineUserId = event.source?.userId;

      if (!lineUserId) {
        stats.skipped++;
        continue;
      }

      if (event.type === "follow") {
        // 친구 추가: line_blocked = false
        const { error } = await supabase
          .from("customers")
          .update({ line_blocked: false })
          .eq("salon_id", salonId)
          .eq("line_user_id", lineUserId);

        if (error) {
          console.error("[line-webhook] Follow update failed:", error);
        } else {
          stats.followed++;
        }

        console.log(`[line-webhook] Follow: salon=${salonId}, lineUser=${lineUserId}`);
      } else if (event.type === "unfollow") {
        // 친구 삭제(블록): line_blocked = true
        const { error } = await supabase
          .from("customers")
          .update({ line_blocked: true })
          .eq("salon_id", salonId)
          .eq("line_user_id", lineUserId);

        if (error) {
          console.error("[line-webhook] Unfollow update failed:", error);
        } else {
          stats.unfollowed++;
        }

        console.log(`[line-webhook] Unfollow: salon=${salonId}, lineUser=${lineUserId}`);
      } else {
        stats.skipped++;
      }
    }

    console.log("[line-webhook] Stats:", JSON.stringify(stats));

    return new Response(
      JSON.stringify({ success: true, ...stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("[line-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
