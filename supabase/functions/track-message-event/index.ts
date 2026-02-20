/**
 * track-message-event
 *
 * 메시지 링크 클릭/예약전환 이벤트 기록
 * 예약 링크에 ?ref=rebook_due&job_id=xxx 형태로 전달
 * 웹앱에서 이 함수를 호출하여 이벤트 기록
 *
 * POST /track-message-event
 * Body: { job_id: string, event_type: 'clicked' | 'converted', metadata?: object }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { job_id, event_type, metadata } = await req.json();

    if (!job_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "job_id and event_type are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (!["clicked", "converted"].includes(event_type)) {
      return new Response(
        JSON.stringify({ error: "event_type must be 'clicked' or 'converted'" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // job 존재 확인
    const { data: job } = await supabase
      .from("message_jobs")
      .select("id")
      .eq("id", job_id)
      .single();

    if (!job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    // 이벤트 기록
    const { error: insertErr } = await supabase
      .from("message_events")
      .insert({
        message_job_id: job_id,
        event_type,
        event_at: new Date().toISOString(),
        metadata: metadata || {},
      });

    if (insertErr) {
      throw insertErr;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("track-message-event error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
