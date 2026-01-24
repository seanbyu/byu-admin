'use server';

import { createClient } from '@supabase/supabase-js';
import { StaffRepository } from '@salon-admin/api-core';

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
    // Assuming salon_id is in metadata or we check a table.
    // Using metadata for performance (Standard Claim)
    const userSalonId = user.user_metadata.salon_id;
    const userRole = user.user_metadata.role;

    if (userSalonId !== salonId) {
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
