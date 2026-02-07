'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type PermissionType = 'canRead' | 'canWrite' | 'canDelete';

export type PermissionModule =
  | 'dashboard'
  | 'bookings'
  | 'customers'
  | 'staff'
  | 'menus'
  | 'reviews'
  | 'sales'
  | 'settings';

interface PermissionCheckResult {
  authorized: boolean;
  error?: string;
  userId?: string;
  salonId?: string;
  role?: string;
}

interface UserPermission {
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

/**
 * 서버 사이드 권한 검증 유틸리티
 *
 * @param accessToken - 사용자 액세스 토큰
 * @param requiredSalonId - 요청된 살롱 ID
 * @param module - 권한 모듈 (예: 'customers', 'staff')
 * @param permissionType - 권한 타입 ('canRead', 'canWrite', 'canDelete')
 */
export async function checkPermission(
  accessToken: string,
  requiredSalonId: string,
  module: PermissionModule,
  permissionType: PermissionType
): Promise<PermissionCheckResult> {
  if (!accessToken) {
    return { authorized: false, error: 'UNAUTHORIZED: No access token' };
  }

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
    // 1. 세션 검증
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return { authorized: false, error: 'UNAUTHORIZED: Invalid session' };
    }

    // 2. 사용자 정보 및 권한 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userData) {
      return { authorized: false, error: 'UNAUTHORIZED: User not found' };
    }

    if (!userData.is_active) {
      return { authorized: false, error: 'UNAUTHORIZED: User is inactive' };
    }

    const userRole = userData.role?.toUpperCase();

    // 3. 살롱 소속 확인
    const { data: staffProfile, error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .select('salon_id, permissions')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      return { authorized: false, error: 'UNAUTHORIZED: Failed to verify salon membership' };
    }

    if (!staffProfile?.salon_id || staffProfile.salon_id !== requiredSalonId) {
      return { authorized: false, error: 'UNAUTHORIZED: Not a member of this salon' };
    }

    // 4. SUPER_ADMIN, ADMIN은 모든 권한 보유
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return {
        authorized: true,
        userId: user.id,
        salonId: staffProfile.salon_id,
        role: userRole,
      };
    }

    // 5. 권한 배열에서 해당 모듈의 권한 확인
    const permissions = staffProfile.permissions as Record<string, UserPermission> | UserPermission[] | null;

    if (!permissions) {
      return { authorized: false, error: 'PERMISSION_DENIED: No permissions configured' };
    }

    // permissions가 배열인 경우 (StaffPermission[] 형태)
    let hasPermission = false;

    if (Array.isArray(permissions)) {
      const modulePerm = permissions.find((p) => p.module === module);
      hasPermission = modulePerm?.[permissionType] ?? false;
    } else {
      // permissions가 객체인 경우 (DB 기본 구조)
      const modulePerm = permissions[module];
      if (modulePerm) {
        // DB 구조: { view, create, edit, delete }
        // 프론트엔드 구조: { canRead, canWrite, canDelete }
        switch (permissionType) {
          case 'canRead':
            hasPermission = modulePerm.canRead ?? (modulePerm as any).view ?? false;
            break;
          case 'canWrite':
            hasPermission = modulePerm.canWrite ?? (modulePerm as any).create ?? (modulePerm as any).edit ?? false;
            break;
          case 'canDelete':
            hasPermission = modulePerm.canDelete ?? (modulePerm as any).delete ?? false;
            break;
        }
      }
    }

    if (!hasPermission) {
      return {
        authorized: false,
        error: `PERMISSION_DENIED: No ${permissionType} permission for ${module}`,
        userId: user.id,
        salonId: staffProfile.salon_id,
        role: userRole,
      };
    }

    return {
      authorized: true,
      userId: user.id,
      salonId: staffProfile.salon_id,
      role: userRole,
    };
  } catch (err: any) {
    console.error('Permission check error:', err);
    return { authorized: false, error: `SERVER_ERROR: ${err.message}` };
  }
}

/**
 * 간단한 역할 기반 권한 검증 (기존 방식 호환)
 * ADMIN, MANAGER 등 특정 역할만 허용
 */
export async function checkRolePermission(
  accessToken: string,
  requiredSalonId: string,
  allowedRoles: string[]
): Promise<PermissionCheckResult> {
  if (!accessToken) {
    return { authorized: false, error: 'UNAUTHORIZED: No access token' };
  }

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
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return { authorized: false, error: 'UNAUTHORIZED: Invalid session' };
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData?.is_active) {
      return { authorized: false, error: 'UNAUTHORIZED: User is inactive' };
    }

    const { data: staffProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('salon_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!staffProfile?.salon_id || staffProfile.salon_id !== requiredSalonId) {
      return { authorized: false, error: 'UNAUTHORIZED: Not a member of this salon' };
    }

    const userRole = userData.role?.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return {
        authorized: false,
        error: 'PERMISSION_DENIED: Insufficient role',
        userId: user.id,
        salonId: staffProfile.salon_id,
        role: userRole,
      };
    }

    return {
      authorized: true,
      userId: user.id,
      salonId: staffProfile.salon_id,
      role: userRole,
    };
  } catch (err: any) {
    console.error('Role permission check error:', err);
    return { authorized: false, error: `SERVER_ERROR: ${err.message}` };
  }
}
