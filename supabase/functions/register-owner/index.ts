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

    if (!email || !password || !name || !salonName || !phone) {
      console.error("Missing required fields:", {
        email,
        password,
        name,
        salonName,
        phone,
      });
      throw new Error(
        "Email, Password, Name, Shop Name (salonName), and Phone are required",
      );
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

    // 1.5 Validate Duplicates
    const { data: existingShop } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("name", salonName)
      .maybeSingle();

    if (existingShop) {
      throw new Error("이미 사용 중인 매장 이름입니다.");
    }

    // Check Phone (in salons)
    const { data: existingPhoneShop } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingPhoneShop) {
      throw new Error("이미 등록된 매장 전화번호입니다.");
    }

    // Check Email (if creating new)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      // If we are updating an existing user (userId provided), this email check might trigger if we didn't change email yet.
      // But usually we are setting NEW email.
      if (!userId || existingUser.id !== userId) {
        throw new Error("이미 가입된 아이디(이메일)입니다.");
      }
    }

    // 3. User Handling
    let targetUserId = userId;

    if (userId) {
      // UPDATE existing user (likely verified via Phone OTP)
      // We must ensure the user exists
      const { data: uData, error: uError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (uError || !uData.user) throw new Error("Invalid User ID");

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

      // Update Email/Password/Metadata
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            ...uData.user.user_metadata,
            name: name,
            user_type: "ADMIN_USER",
            role: "ADMIN",
          },
        });
      if (updateError) throw updateError;
    } else {
      // CREATE new user (standard flow)
      // Check Phone in users table only if creating new (to avoid duplicate)
      const { data: existingPhoneUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingPhoneUser) {
        throw new Error("이미 가입된 휴대폰 번호입니다.");
      }

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
      targetUserId = authData.user.id;
    }

    const finalUserId = targetUserId;

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
      // Rollback only if we created the user purely for this?
      // If we updated existing user, rollback might break account?
      // Strict transaction hard here.
      // If new user -> delete. If existing -> We already updated email. Hard to revert perfectly.
      // Best effort:
      if (!userId) await supabaseAdmin.auth.admin.deleteUser(finalUserId);
      throw salonError;
    }

    const salonId = salonData.id;

    // 4.5 Insert Salon Industries
    if (reqBody.industryNames && Array.isArray(reqBody.industryNames)) {
      const industryNames = reqBody.industryNames;

      // Get industry IDs for the names
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
          console.error("Error inserting industries:", industriesError);
          // Rollback all
          await supabaseAdmin.from("salons").delete().eq("id", salonId);
          if (!userId) await supabaseAdmin.auth.admin.deleteUser(finalUserId);
          throw new Error(
            "Failed to save industries: " + industriesError.message,
          );
        }
      }
    }

    // 5. Update User with Salon ID and user_type
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({
        salon_id: salonId,
        is_active: true,
        is_approved: false,
        phone: phone,
        user_type: "ADMIN_USER",
        role: "ADMIN",
      })
      .eq("id", finalUserId);

    if (userError) {
      // Rollback
      await supabaseAdmin.from("salons").delete().eq("id", salonId);
      if (!userId) await supabaseAdmin.auth.admin.deleteUser(finalUserId);
      throw userError;
    }

    // 6. Upsert Staff Profile with Permissions
    // (휴대폰 인증 후 CUSTOMER로 생성된 경우 staff_profiles가 없으므로 upsert 사용)
    const { error: profileError } = await supabaseAdmin
      .from("staff_profiles")
      .upsert({
        user_id: finalUserId,
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
      console.error("Error creating admin profile:", profileError);
      // Rollback
      await supabaseAdmin.from("salons").delete().eq("id", salonId);
      if (!userId) await supabaseAdmin.auth.admin.deleteUser(finalUserId);
      throw new Error("Failed to set permissions: " + profileError.message);
    }

    // 7. Email is sent automatically by Supabase (via Dashboard SMTP settings)

    return new Response(
      JSON.stringify({
        message: "Owner registered successfully (Verification email sent)",
        user: { id: finalUserId }, // simplified return
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
