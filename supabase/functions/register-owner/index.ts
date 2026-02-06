import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Cleanup tracker for rollback
interface CleanupTracker {
  authUserCreated: boolean;
  authUserId: string | null;
  salonCreated: boolean;
  salonId: string | null;
  userRecordCreated: boolean;
  originalAuthMetadata: Record<string, unknown> | null;
  isOtpUser: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Initialize cleanup tracker
  const cleanup: CleanupTracker = {
    authUserCreated: false,
    authUserId: null,
    salonCreated: false,
    salonId: null,
    userRecordCreated: false,
    originalAuthMetadata: null,
    isOtpUser: false,
  };

  // Create Supabase Service Role Client (early init for cleanup)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Cleanup function
  const performCleanup = async () => {
    console.log("Performing cleanup...", cleanup);

    try {
      // Delete salon first (has FK dependencies)
      if (cleanup.salonCreated && cleanup.salonId) {
        console.log("Deleting salon:", cleanup.salonId);
        await supabaseAdmin.from("staff_profiles").delete().eq("salon_id", cleanup.salonId);
        await supabaseAdmin.from("salon_industries").delete().eq("salon_id", cleanup.salonId);
        await supabaseAdmin.from("service_categories").delete().eq("salon_id", cleanup.salonId);
        await supabaseAdmin.from("salons").delete().eq("id", cleanup.salonId);
      }

      // Delete user record
      if (cleanup.userRecordCreated && cleanup.authUserId) {
        console.log("Deleting user record:", cleanup.authUserId);
        await supabaseAdmin.from("user_identities").delete().eq("user_id", cleanup.authUserId);
        await supabaseAdmin.from("users").delete().eq("id", cleanup.authUserId);
      }

      // Handle auth user
      if (cleanup.authUserId) {
        if (cleanup.authUserCreated) {
          // Delete newly created auth user
          console.log("Deleting auth user:", cleanup.authUserId);
          await supabaseAdmin.auth.admin.deleteUser(cleanup.authUserId);
        } else if (cleanup.isOtpUser && cleanup.originalAuthMetadata) {
          // Revert OTP user's metadata changes
          console.log("Reverting OTP user metadata:", cleanup.authUserId);
          await supabaseAdmin.auth.admin.updateUserById(cleanup.authUserId, {
            user_metadata: cleanup.originalAuthMetadata,
          });
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  };

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

    // 1.4 Validate Format
    const salonNameRegex = /^[a-zA-Z0-9_가-힣]+$/;
    if (!salonNameRegex.test(salonName)) {
      throw new Error(
        "매장 이름은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다 (띄어쓰기, 하이픈 불가)",
      );
    }

    // 1.5 Validate Duplicates (before any mutations)
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

    // Check Email
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      if (!userId || existingUser.id !== userId) {
        throw new Error("이미 가입된 아이디(이메일)입니다.");
      }
    }

    // 3. User Handling
    let targetUserId = userId;

    if (userId) {
      // UPDATE existing user (likely verified via Phone OTP)
      cleanup.isOtpUser = true;
      cleanup.authUserId = userId;

      const { data: uData, error: uError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (uError || !uData.user) throw new Error("Invalid User ID");

      // Store original metadata for rollback
      cleanup.originalAuthMetadata = uData.user.user_metadata || {};

      // Update Email/Password/Metadata
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            ...uData.user.user_metadata,
            name: name,
            user_type: "SALON",
            role: "ADMIN",
          },
        });
      if (updateError) throw updateError;
    } else {
      // CREATE new user (standard flow)
      // Check Phone in users table only if creating new
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
            user_type: "SALON",
            role: "ADMIN",
          },
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create auth user");

      targetUserId = authData.user.id;
      cleanup.authUserCreated = true;
      cleanup.authUserId = targetUserId;
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
      console.error("Salon creation error:", salonError);
      await performCleanup();
      throw new Error("매장 생성 실패: " + salonError.message);
    }

    cleanup.salonCreated = true;
    cleanup.salonId = salonData.id;
    const salonId = salonData.id;

    // 4.5 Insert Salon Industries
    let hasHairIndustry = false;
    let hairIndustryId: string | null = null;

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

        const hairIndustry = industriesData.find(
          (ind: any) => ind.name.toLowerCase() === "hair"
        );
        if (hairIndustry) {
          hasHairIndustry = true;
          hairIndustryId = hairIndustry.id;
        }

        const { error: industriesError } = await supabaseAdmin
          .from("salon_industries")
          .insert(salonIndustriesRows);

        if (industriesError) {
          console.error("Error inserting industries:", industriesError);
          await performCleanup();
          throw new Error("업종 저장 실패: " + industriesError.message);
        }
      }
    }

    // 4.6 Create default service categories for Hair industry
    if (hasHairIndustry && hairIndustryId) {
      const defaultHairCategories = [
        { name: "Cut", name_en: "Cut", name_th: "ตัดผม", display_order: 1 },
        { name: "Perm", name_en: "Perm", name_th: "ดัดผม", display_order: 2 },
        { name: "Color", name_en: "Color", name_th: "ทำสีผม", display_order: 3 },
        { name: "Clinic", name_en: "Clinic", name_th: "คลินิก", display_order: 4 },
      ];

      const categoryRows = defaultHairCategories.map((cat) => ({
        salon_id: salonId,
        industry_id: hairIndustryId,
        name: cat.name,
        name_en: cat.name_en,
        name_th: cat.name_th,
        display_order: cat.display_order,
        is_active: true,
      }));

      const { error: categoriesError } = await supabaseAdmin
        .from("service_categories")
        .insert(categoryRows);

      if (categoriesError) {
        console.error("Error creating default categories:", categoriesError);
        // Non-critical, continue
      }
    }

    // 5. Upsert User (base info only)
    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: finalUserId,
        email: email,
        name: name,
        is_active: true,
        phone: phone,
        user_type: "SALON",
        role: "ADMIN",
      }, {
        onConflict: "id",
      });

    if (userError) {
      console.error("User record creation error:", userError);
      await performCleanup();
      throw new Error("사용자 정보 저장 실패: " + userError.message);
    }

    cleanup.userRecordCreated = true;

    // 5.5 Create user_identity for EMAIL provider (optional - skip if table doesn't exist)
    try {
      const { error: identityError } = await supabaseAdmin
        .from("user_identities")
        .upsert({
          user_id: finalUserId,
          auth_id: finalUserId,
          provider: "EMAIL",
          provider_user_id: email,
          profile: { email: email, name: name },
          is_primary: true,
        }, {
          onConflict: "auth_id",
        });

      if (identityError) {
        console.error("Error creating user identity (non-critical):", identityError);
        // Non-critical - continue without failing
      }
    } catch (identityErr) {
      console.error("user_identities table might not exist:", identityErr);
      // Continue without failing
    }

    // 6. Upsert Staff Profile with salon_id, is_owner, and Permissions
    const defaultWorkSchedule = {
      monday: { enabled: false, start: null, end: null },
      tuesday: { enabled: true, start: "10:00", end: "21:00" },
      wednesday: { enabled: true, start: "10:00", end: "21:00" },
      thursday: { enabled: true, start: "10:00", end: "21:00" },
      friday: { enabled: true, start: "10:00", end: "21:00" },
      saturday: { enabled: true, start: "10:00", end: "21:00" },
      sunday: { enabled: true, start: "10:00", end: "21:00" },
    };

    const { error: profileError } = await supabaseAdmin
      .from("staff_profiles")
      .upsert({
        user_id: finalUserId,
        salon_id: salonId,
        is_owner: true,
        is_approved: true,
        approved_by: finalUserId,
        approved_at: new Date().toISOString(),
        work_schedule: defaultWorkSchedule,
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
      await performCleanup();
      throw new Error("권한 설정 실패: " + profileError.message);
    }

    // Success!
    return new Response(
      JSON.stringify({
        message: "Owner registered successfully (Verification email sent)",
        user: { id: finalUserId },
        salonId: salonId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
