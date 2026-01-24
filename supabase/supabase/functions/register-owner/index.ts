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
    // 1. Get the request body
    const reqBody = await req.json().catch((err) => {
      console.error("JSON Parse Error:", err);
      throw new Error("Invalid JSON body");
    });

    console.log("Register Request Body:", reqBody);

    const { email, password, name, salonName, phone, userId } = reqBody;

    const missing: string[] = [];
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (!name) missing.push("name");
    if (!salonName) missing.push("salonName");
    if (!phone) missing.push("phone");

    if (missing.length > 0) {
      console.error("Missing required fields:", missing);
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    // 2. Create Supabase Service Role Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1.4 Validate Format
    const salonNameRegex = /^[a-zA-Z0-9_가-힣]+$/;
    if (!salonNameRegex.test(salonName)) {
      throw new Error(
        "매장 이름은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다 (띄어쓰기, 하이픈 불가)",
      );
    }

    // 1.5 Validate Duplicates (Using Count)
    const { count: shopCount } = await supabaseAdmin
      .from("salons")
      .select("*", { count: "exact", head: true })
      .eq("name", salonName);

    if (shopCount && shopCount > 0) {
      throw new Error("이미 사용 중인 매장 이름입니다.");
    }

    const { count: phoneShopCount } = await supabaseAdmin
      .from("salons")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone);

    if (phoneShopCount && phoneShopCount > 0) {
      throw new Error("이미 등록된 매장 전화번호입니다.");
    }

    let phoneUserQuery = supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone);

    if (userId) {
      phoneUserQuery = phoneUserQuery.neq("id", userId);
    }
    const { count: phoneUserCount } = await phoneUserQuery;

    if (phoneUserCount && phoneUserCount > 0) {
      throw new Error("이미 가입된 휴대폰 번호입니다.");
    }

    let emailUserQuery = supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("email", email);

    if (userId) {
      emailUserQuery = emailUserQuery.neq("id", userId);
    }
    const { count: emailUserCount } = await emailUserQuery;

    if (emailUserCount && emailUserCount > 0) {
      throw new Error("이미 가입된 이메일입니다.");
    }

    let targetUserId = userId;
    let finalUser;

    if (userId) {
      // 기존 사용자가 CUSTOMER로 생성되었을 수 있으므로 customer_profiles 삭제
      // (휴대폰 인증 시 기본값 CUSTOMER로 생성되어 customer_profiles가 만들어짐)
      const { error: deleteProfileError } = await supabaseAdmin
        .from("customer_profiles")
        .delete()
        .eq("user_id", userId);

      if (deleteProfileError) {
        console.log(
          "customer_profiles delete (may not exist):",
          deleteProfileError.message,
        );
      }

      // Update Existing User
      const { data: updateData, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: name,
            phone: phone,
            user_type: "ADMIN_USER",
            role: "ADMIN",
          },
        });

      if (updateError) throw updateError;
      if (!updateData.user) throw new Error("Failed to update auth user");
      finalUser = updateData.user;
    } else {
      // Create New User
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          phone: phone,
          email_confirm: true,
          user_metadata: {
            name: name,
            phone: phone,
            user_type: "ADMIN_USER",
            role: "ADMIN",
          },
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create auth user");
      finalUser = authData.user;
      targetUserId = authData.user.id;
    }

    // 4. Create Salon
    const { data: salonData, error: salonError } = await supabaseAdmin
      .from("salons")
      .insert({
        name: salonName,
        email: email,
        phone: phone,
        address: "",
        city: "",
        country: "",
      })
      .select("id")
      .single();

    if (salonError) {
      if (!userId) await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      throw salonError;
    }

    const salonId = salonData.id;

    // 4.5 Insert Salon Industries
    if (reqBody.industryNames && Array.isArray(reqBody.industryNames)) {
      const industryNames = reqBody.industryNames;
      const { data: industriesData } = await supabaseAdmin
        .from("industries")
        .select("id, name")
        .in("name", industryNames);

      if (industriesData && industriesData.length > 0) {
        const salonIndustriesRows = industriesData.map((ind: any) => ({
          salon_id: salonId,
          industry_id: ind.id,
        }));

        const { error: industriesError } = await supabaseAdmin
          .from("salon_industries")
          .insert(salonIndustriesRows);

        if (industriesError) {
          await supabaseAdmin.from("salons").delete().eq("id", salonId);
          if (!userId) await supabaseAdmin.auth.admin.deleteUser(targetUserId);
          throw new Error(
            "Failed to save industries: " + industriesError.message,
          );
        }
      }
    }

    // 5. Upsert User with Salon ID
    // 휴대폰 인증으로 생성된 경우 users 테이블에 행이 없을 수 있으므로 upsert 사용
    const { error: userError } = await supabaseAdmin.from("users").upsert({
      id: targetUserId,
      email: email,
      name: name,
      salon_id: salonId,
      is_active: true,
      is_approved: false,
      phone: phone,
      user_type: "ADMIN_USER",
      role: "ADMIN",
    }, {
      onConflict: "id",
    });

    if (userError) {
      await supabaseAdmin.from("salons").delete().eq("id", salonId);
      if (!userId) await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      throw userError;
    }

    // 6. Upsert Staff Profile with Permissions
    // (휴대폰 인증 후 CUSTOMER로 생성된 경우 staff_profiles가 없으므로 upsert 사용)
    const { error: profileError } = await supabaseAdmin
      .from("staff_profiles")
      .upsert({
        user_id: targetUserId,
        permissions: {
          bookings: { view: true, create: true, edit: true, delete: true },
          customers: { view: true, create: true, edit: true, delete: true },
          services: { view: true, create: true, edit: true, delete: true },
          staff: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, edit: true },
          financials: { view: true },
        },
      });

    if (profileError) {
      await supabaseAdmin.from("salons").delete().eq("id", salonId);
      if (!userId) await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      throw new Error("Failed to set permissions: " + profileError.message);
    }

    return new Response(
      JSON.stringify({
        message: "Owner registered successfully",
        user: finalUser,
        salonId: salonId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
