'use server';

import { createClient } from '@supabase/supabase-js';
import { StaffRepository } from '@/lib/api-core';
import { checkPermission } from '@/lib/server/checkPermission';

// ============================================
// Types
// ============================================

interface CreateStaffParams {
  salonId: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  accessToken: string;
}

interface DeleteStaffParams {
  staffId: string;
  salonId: string;
  accessToken: string;
}

// 기본 권한 설정: 조회/등록/수정 가능, 삭제 불가
const DEFAULT_PERMISSIONS = {
  dashboard: { canRead: true, canWrite: true, canDelete: false },
  bookings: { canRead: true, canWrite: true, canDelete: false },
  customers: { canRead: true, canWrite: true, canDelete: false },
  staff: { canRead: true, canWrite: true, canDelete: false },
  menus: { canRead: true, canWrite: true, canDelete: false },
  reviews: { canRead: true, canWrite: true, canDelete: false },
  sales: { canRead: true, canWrite: true, canDelete: false },
  settings: { canRead: true, canWrite: true, canDelete: false },
};

// Supabase Admin Client 생성 헬퍼
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ============================================
// 직원 생성
// ============================================

export async function createStaff({
  salonId,
  email,
  name,
  role,
  password,
  accessToken,
}: CreateStaffParams) {
  // 권한 검증: staff 모듈의 canWrite 권한 필요
  const permCheck = await checkPermission(accessToken, salonId, 'staff', 'canWrite');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  const supabaseAdmin = createAdminClient();

  try {
    const staffRepo = new StaffRepository(supabaseAdmin);

    // 1. Check Quota
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

    // 2. Create Auth User
    const tempPassword = password || 'salon1234!';

    let finalEmail = email;
    if (!finalEmail.includes('@')) {
      finalEmail = `${email}@salon.local`;
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: finalEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        user_type: 'SALON',
        salon_id: salonId,
        is_approved: true,
      },
    });

    if (createError) throw createError;
    if (!newUser.user) throw new Error('Failed to create user');

    const newUserId = newUser.user.id;

    // 3. Check if trigger created user, if not insert manually
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', newUserId)
      .maybeSingle();

    if (!existingUser) {
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: newUserId,
          user_type: 'SALON',
          role: role.toUpperCase(),
          email: finalEmail,
          name: name,
          is_active: true,
        });

      if (userInsertError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        console.error('User insert error:', JSON.stringify(userInsertError, null, 2));
        throw new Error(`ERROR_CREATE_USER_PROFILE: ${userInsertError.message} (${userInsertError.code})`);
      }
    } else {
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          role: role.toUpperCase(),
          name: name,
        })
        .eq('id', newUserId);

      if (userUpdateError) {
        console.error('User update error:', userUpdateError);
      }
    }

    // 4. Check if trigger created staff_profile, if not insert manually
    const { data: existingProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('user_id')
      .eq('user_id', newUserId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileInsertError } = await supabaseAdmin
        .from('staff_profiles')
        .insert({
          user_id: newUserId,
          salon_id: salonId,
          is_owner: false,
          is_approved: true,
          approved_by: permCheck.userId,
          approved_at: new Date().toISOString(),
          created_by: permCheck.userId,
          is_booking_enabled: true,
          permissions: DEFAULT_PERMISSIONS,
        });

      if (profileInsertError) {
        await supabaseAdmin.from('users').delete().eq('id', newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        console.error('Staff profile insert error:', profileInsertError);
        throw new Error(`ERROR_CREATE_STAFF_PROFILE: ${profileInsertError.message}`);
      }
    } else {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('staff_profiles')
        .update({
          salon_id: salonId,
          is_approved: true,
          approved_by: permCheck.userId,
          approved_at: new Date().toISOString(),
          is_booking_enabled: true,
          permissions: DEFAULT_PERMISSIONS,
        })
        .eq('user_id', newUserId);

      if (profileUpdateError) {
        console.error('Staff profile update error:', profileUpdateError);
      }
    }

    return { success: true, message: 'Staff created successfully!' };
  } catch (err: any) {
    console.error('Create Staff Error:', err);
    return { error: err.message };
  }
}

export const inviteStaff = createStaff;

// ============================================
// 직원 퇴사 처리 (완전 삭제)
// ============================================

export async function deleteStaff({
  staffId,
  salonId,
  accessToken,
}: DeleteStaffParams) {
  // 권한 검증: staff 모듈의 canDelete 권한 필요
  const permCheck = await checkPermission(accessToken, salonId, 'staff', 'canDelete');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  // 본인 삭제 방지
  if (permCheck.userId === staffId) {
    return { error: 'ERROR_CANNOT_DELETE_SELF' };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 삭제 대상이 오너인지 확인 (오너는 삭제 불가)
    const { data: targetProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('is_owner')
      .eq('user_id', staffId)
      .eq('salon_id', salonId)
      .maybeSingle();

    if (targetProfile?.is_owner) {
      return { error: 'ERROR_CANNOT_DELETE_OWNER' };
    }

    // 1. staff_profiles 삭제
    const { error: profileDeleteError } = await supabaseAdmin
      .from('staff_profiles')
      .delete()
      .eq('user_id', staffId);

    if (profileDeleteError) {
      console.error('Staff profile delete error:', profileDeleteError);
      throw new Error('Failed to delete staff profile');
    }

    // 2. public.users 삭제
    const { error: userDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', staffId);

    if (userDeleteError) {
      console.error('User delete error:', userDeleteError);
      throw new Error('Failed to delete user');
    }

    // 3. auth.users 삭제
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(staffId);

    if (authDeleteError) {
      console.error('Auth user delete error:', authDeleteError);
      throw new Error('Failed to delete auth user');
    }

    return { success: true, message: 'Staff deleted successfully!' };
  } catch (err: any) {
    console.error('Delete Staff Error:', err);
    return { error: err.message };
  }
}

// ============================================
// 직원 퇴사 예정 처리 (1주일 유예 - Soft Delete)
// ============================================

export async function softDeleteStaff({
  staffId,
  salonId,
  accessToken,
}: DeleteStaffParams) {
  // 권한 검증: staff 모듈의 canWrite 권한 필요 (soft delete는 수정 권한으로 처리)
  const permCheck = await checkPermission(accessToken, salonId, 'staff', 'canWrite');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  // 본인 삭제 방지
  if (permCheck.userId === staffId) {
    return { error: 'ERROR_CANNOT_DELETE_SELF' };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 삭제 대상이 오너인지 확인 (오너는 삭제 불가)
    const { data: targetProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('is_owner')
      .eq('user_id', staffId)
      .eq('salon_id', salonId)
      .maybeSingle();

    if (targetProfile?.is_owner) {
      return { error: 'ERROR_CANNOT_DELETE_OWNER' };
    }

    // Soft delete: is_active=false, deleted_at=now()
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', staffId);

    if (userUpdateError) {
      console.error('User soft delete error:', userUpdateError);
      throw new Error('Failed to process resignation');
    }

    return { success: true, message: 'Staff resignation scheduled!' };
  } catch (err: any) {
    console.error('Soft Delete Staff Error:', err);
    return { error: err.message };
  }
}

// ============================================
// 퇴사 예정 취소 (복구)
// ============================================

export async function cancelResignation({
  staffId,
  salonId,
  accessToken,
}: DeleteStaffParams) {
  // 권한 검증: staff 모듈의 canWrite 권한 필요
  const permCheck = await checkPermission(accessToken, salonId, 'staff', 'canWrite');

  if (!permCheck.authorized) {
    return { error: permCheck.error };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 복구: is_active=true, deleted_at=null
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: true,
        deleted_at: null,
      })
      .eq('id', staffId);

    if (userUpdateError) {
      console.error('Cancel resignation error:', userUpdateError);
      throw new Error('Failed to cancel resignation');
    }

    return { success: true, message: 'Resignation cancelled!' };
  } catch (err: any) {
    console.error('Cancel Resignation Error:', err);
    return { error: err.message };
  }
}
