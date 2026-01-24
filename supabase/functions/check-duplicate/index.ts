import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Environment Variables");
      throw new Error("Server misconfiguration: Missing Supabase Env Vars");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch((err) => {
      console.error("JSON Parse Error:", err);
      throw new Error("Invalid JSON body");
    });

    console.log("Received Check Duplicate Request:", body);
    const { type, value } = body;

    if (!type || !value) {
      console.error("Missing type or value:", body);
      throw new Error("Type and Value are required");
    }

    if (type === "email") {
      // Check users table (owned by auth, but checking public users table first for safety)
      // Actually strictly we should check auth.users via admin api usually, but checking 'users' table is good enough proxy if we sync well.
      // Let's check 'users' table as it is the public profile.
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", value)
        .maybeSingle();

      if (error) {
        console.error("Database Error (Email):", error);
        throw error;
      }

      if (data) {
        return new Response(
          JSON.stringify({
            available: false,
            message: "이미 가입된 이메일입니다.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
    } else if (type === "salonName") {
      // Validate regex first
      const salonNameRegex = /^[a-zA-Z0-9_가-힣]+$/;
      if (!salonNameRegex.test(value)) {
        return new Response(
          JSON.stringify({
            available: false,
            message: "한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }

      const { data, error } = await supabaseAdmin
        .from("salons")
        .select("id")
        .eq("name", value)
        .maybeSingle();

      if (error) {
        console.error("Database Error (SalonName):", error);
        throw error;
      }

      if (data) {
        return new Response(
          JSON.stringify({
            available: false,
            message: "이미 사용 중인 매장 이름입니다.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
    } else {
      throw new Error(`Invalid type: ${type}`);
    }

    return new Response(
      JSON.stringify({ available: true, message: "사용 가능합니다." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Edge Function Error:", error);
    // Return 200 even on error so client can handle message gracefully
    return new Response(
      JSON.stringify({
        available: false,
        message: error.message || "알 수 없는 오류가 발생했습니다.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});
