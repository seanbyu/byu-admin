'use server';

import { createClient } from '@supabase/supabase-js';
import { StaffRepository } from '@/lib/api-core';

interface CreateStaffParams {
  salonId: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  accessToken: string;
}

export async function createStaff({
  salonId,
  email,
  name,
  role,
  password,
  accessToken,
}: CreateStaffParams) {
  if (!accessToken) {
    return { error: 'You must be logged in to create staff.' };
  }

  // Admin Client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // 1. Authenticate & Authorize
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      throw new Error('Unauthorized: Invalid session');
    }

    // Verify user belongs to the salon and has permission
    // Check staff_profiles table for accurate salon membership (user_metadata may be stale)
    const { data: staffProfile, error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .select('salon_id, is_owner')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Staff profile query error:', profileError);
      throw new Error('Failed to verify user permissions');
    }

    // Get role from users table (more reliable than metadata)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('User query error:', userError);
      throw new Error('Failed to verify user role');
    }

    const userSalonId = staffProfile?.salon_id;
    const userRole = userData?.role?.toUpperCase() || user.user_metadata?.role?.toUpperCase();

    if (!userSalonId || userSalonId !== salonId) {
      throw new Error(
        'Unauthorized: You do not have permission for this salon'
      );
    }

    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      throw new Error('Unauthorized: Insufficient permissions');
    }

    // ... continue with logic ...
    const staffRepo = new StaffRepository(supabaseAdmin);

    // 2. Check Quota
    const { data: salon, error: salonError } = await supabaseAdmin
      .from('salons')
      .select('plan_type')
      .eq('id', salonId)
      .single();

    if (salonError) throw new Error('Failed to fetch salon info');

    const planType = salon?.plan_type || 'FREE';

    if (planType === 'FREE') {
      const staffCount = await staffRepo.getStaffCount(salonId);
      if (staffCount >= 5) {
        return {
          error: 'LIMIT_REACHED: Free plan allows up to 5 staff members.',
        };
      }
    }

    // 3. Create User
    const tempPassword = password || 'salon1234!'; // Default if not provided

    let finalEmail = email;
    if (!finalEmail.includes('@')) {
      finalEmail = `${email}@salon.local`;
    }

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: finalEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        user_type: 'ADMIN_USER',
        salon_id: salonId,
        is_approved: true,
      },
    });

    if (createError) throw createError;

    return { success: true, message: 'Staff created successfully!' };
  } catch (err: any) {
    console.error('Create Staff Error:', err);
    return { error: err.message };
  }
}
export const inviteStaff = createStaff;
