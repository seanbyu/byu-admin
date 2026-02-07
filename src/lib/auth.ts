/**
 * Supabase 인증 서비스
 */

import { supabase as _supabase } from './supabase/client';
import { User, UserRole } from '@/types';

const supabase = _supabase as any;

// 에러 코드 정의
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_FAILED'
  | 'LOGIN_ERROR'
  | 'SIGNUP_FAILED'
  | 'SIGNUP_ERROR'
  | 'SIGNOUT_ERROR'
  | 'PASSWORD_RESET_ERROR'
  | 'PASSWORD_UPDATE_ERROR'
  | 'SALON_PENDING_APPROVAL'
  | 'SALON_REJECTED'
  | 'STAFF_RESIGNED';

interface AuthResponse {
  user: User | null;
  token: string | null;
  error?: string;
  errorCode?: AuthErrorCode;
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Supabase 인증
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return {
        user: null,
        token: null,
        error: authError.message,
        errorCode: 'INVALID_CREDENTIALS',
      };
    }

    if (!authData.user || !authData.session) {
      return {
        user: null,
        token: null,
        error: 'Login failed',
        errorCode: 'LOGIN_FAILED',
      };
    }

    // users 테이블에서 추가 정보 조회 (타임아웃 10초)
    const userQueryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Query timeout' } }), 10000)
    );

    const { data: userData, error: userError } = await Promise.race([
      userQueryPromise,
      timeoutPromise,
    ]);

    // ========================================
    // 살롱 승인 상태 체크 함수
    // ADMIN, MANAGER 역할 모두 살롱 승인 체크 필요
    // ========================================
    const checkSalonApproval = async (salonId: string, role: string): Promise<AuthResponse | null> => {
      // ADMIN 또는 MANAGER 역할만 살롱 승인 체크
      if (role !== 'ADMIN' && role !== 'MANAGER') return null;

      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id, approval_status, rejected_reason')
        .eq('id', salonId)
        .maybeSingle();

      if (salonError) {
        console.warn('Salon query error:', salonError.message);
        return null;
      }

      if (!salonData) {
        console.warn('Salon not found:', salonId);
        return null;
      }

      // 살롱 승인 상태 체크
      if (salonData.approval_status === 'pending') {
        await supabase.auth.signOut();
        return {
          user: null,
          token: null,
          error: 'Salon is pending approval',
          errorCode: 'SALON_PENDING_APPROVAL',
        };
      }

      if (salonData.approval_status === 'rejected') {
        await supabase.auth.signOut();
        return {
          user: null,
          token: null,
          error: salonData.rejected_reason || 'Salon has been rejected',
          errorCode: 'SALON_REJECTED',
        };
      }

      return null; // approved - 로그인 허용
    };

    // ========================================
    // users 테이블에 데이터가 없는 경우 (Fallback)
    // ========================================
    if (userError || !userData) {
      const metaRole = (authData.user.user_metadata?.role?.toUpperCase() as string) || 'MANAGER';
      const metaSalonId = authData.user.user_metadata?.salon_id;

      // ADMIN 또는 MANAGER 역할이고 salon_id가 있으면 살롱 승인 상태 체크
      if (metaSalonId && (metaRole === 'ADMIN' || metaRole === 'MANAGER')) {
        const approvalError = await checkSalonApproval(metaSalonId, metaRole);
        if (approvalError) return approvalError;
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name:
          authData.user.user_metadata?.name ||
          authData.user.email!.split('@')[0],
        phone: authData.user.user_metadata?.phone || '',
        role: metaRole as UserRole,
        salonId: metaSalonId,
        profileImage: authData.user.user_metadata?.avatar_url,
        createdAt: new Date(authData.user.created_at),
        updatedAt: new Date(
          authData.user.updated_at || authData.user.created_at
        ),
        isActive: true,
      };

      return {
        user,
        token: authData.session.access_token,
      };
    }

    // ========================================
    // users 테이블에 데이터가 있는 경우
    // ========================================

    // 퇴사 처리된 유저 체크 (is_active=false, deleted_at 존재)
    if (!userData.is_active && userData.deleted_at) {
      await supabase.auth.signOut();
      return {
        user: null,
        token: null,
        error: 'Staff resignation in progress',
        errorCode: 'STAFF_RESIGNED',
      };
    }

    const role = userData.role?.toUpperCase() || 'MANAGER';
    let salonId: string | undefined = undefined;
    let isOwner = false;
    let isApproved = true;
    let permissions: any[] = [];

    // staff_profiles에서 salon_id, is_owner, is_approved, permissions 조회
    if (role === 'ADMIN' || role === 'MANAGER' || role === 'ARTIST' || role === 'STAFF') {
      const { data: profileData, error: profileError } = await supabase
        .from('staff_profiles')
        .select('salon_id, is_owner, is_approved, permissions')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Error fetching staff_profiles:', profileError.message);
      }

      if (profileData) {
        salonId = profileData.salon_id;
        isOwner = profileData.is_owner ?? false;
        isApproved = profileData.is_approved ?? true;

        if (profileData.permissions) {
          permissions = Object.entries(profileData.permissions || {}).map(
            ([key, val]: [string, any]) => ({
              module: key,
              canRead: val.view || false,
              canWrite: val.edit || val.create || false,
              canDelete: val.delete || false,
            })
          );
        }
      }
    }

    // ADMIN 또는 MANAGER 역할이고 salon_id가 있으면 살롱 승인 상태 체크
    if (salonId && (role === 'ADMIN' || role === 'MANAGER')) {
      const approvalError = await checkSalonApproval(salonId, role);
      if (approvalError) return approvalError;
    }

    // users 테이블 데이터를 User 타입으로 변환
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: role as UserRole,
      salonId: salonId,
      profileImage: userData.profile_image,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      isActive: userData.is_active ?? true,
      isOwner: isOwner,
      isApproved: isApproved,
      permissions: permissions,
    };

    return {
      user,
      token: authData.session.access_token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      user: null,
      token: null,
      error: 'Login error',
      errorCode: 'LOGIN_ERROR',
    };
  }
}

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: {
    name: string;
    phone?: string;
    role?: UserRole;
  }
): Promise<AuthResponse> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          phone: metadata.phone,
          role: metadata.role || UserRole.CUSTOMER,
        },
      },
    });

    if (authError) {
      return {
        user: null,
        token: null,
        error: authError.message,
        errorCode: 'SIGNUP_FAILED',
      };
    }

    if (!authData.user) {
      return {
        user: null,
        token: null,
        error: 'Signup failed',
        errorCode: 'SIGNUP_FAILED',
      };
    }

    // users 테이블에 사용자 정보 저장
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email!,
      name: metadata.name,
      phone: metadata.phone || '',
      role: metadata.role || UserRole.CUSTOMER,
      is_active: true,
    });

    if (insertError) {
      console.error('Error inserting user data:', insertError);
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name: metadata.name,
      phone: metadata.phone || '',
      role: metadata.role || UserRole.CUSTOMER,
      createdAt: new Date(authData.user.created_at),
      updatedAt: new Date(authData.user.created_at),
      isActive: true,
      // SignUp usually doesn't have permissions immediately unless auto-assigned
    };

    return {
      user,
      token: authData.session?.access_token || null,
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      user: null,
      token: null,
      error: 'Signup error',
      errorCode: 'SIGNUP_ERROR',
    };
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ error?: string; errorCode?: AuthErrorCode }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message, errorCode: 'SIGNOUT_ERROR' };
    }
    return {};
  } catch (error) {
    console.error('Signout error:', error);
    return { error: 'Signout error', errorCode: 'SIGNOUT_ERROR' };
  }
}

/**
 * 현재 세션 가져오기
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * 비밀번호 재설정 이메일 보내기
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ error?: string; errorCode?: AuthErrorCode }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      return { error: error.message, errorCode: 'PASSWORD_RESET_ERROR' };
    }

    return {};
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: 'Password reset error', errorCode: 'PASSWORD_RESET_ERROR' };
  }
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error?: string; errorCode?: AuthErrorCode }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message, errorCode: 'PASSWORD_UPDATE_ERROR' };
    }

    return {};
  } catch (error) {
    console.error('Update password error:', error);
    return { error: 'Password update error', errorCode: 'PASSWORD_UPDATE_ERROR' };
  }
}

/**
 * 현재 로그인한 사용자 정보 가져오기 (DB 조회 포함)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();

    if (userError || !userData) {
      // DB에 정보가 없으면 auth 정보로 fallback (임시)
      const user: User = {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email!,
        name:
          sessionData.session.user.user_metadata?.name ||
          sessionData.session.user.email!.split('@')[0],
        phone: sessionData.session.user.user_metadata?.phone || '',
        role:
          (sessionData.session.user.user_metadata?.role as UserRole) ||
          UserRole.MANAGER,
        salonId: sessionData.session.user.user_metadata?.salon_id,
        profileImage: sessionData.session.user.user_metadata?.avatar_url,
        createdAt: new Date(sessionData.session.user.created_at),
        updatedAt: new Date(
          sessionData.session.user.updated_at ||
            sessionData.session.user.created_at
        ),
        isActive: true,
      };
      return user;
    }

    // staff_profiles에서 salon_id, is_owner, is_approved, permissions 조회
    const role = userData.role?.toUpperCase();
    let salonId: string | undefined = undefined;
    let isOwner = false;
    let isApproved = true;
    let permissions: any[] = [];

    if (role === 'ADMIN' || role === 'MANAGER' || role === 'ARTIST' || role === 'STAFF') {
      const { data: profileData, error: profileError } = await supabase
        .from('staff_profiles')
        .select('salon_id, is_owner, is_approved, permissions')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Error fetching staff_profiles:', profileError.message);
      }

      if (profileData) {
        salonId = profileData.salon_id;
        isOwner = profileData.is_owner ?? false;
        isApproved = profileData.is_approved ?? true;

        if (profileData.permissions) {
          permissions = Object.entries(profileData.permissions || {}).map(
            ([key, val]: [string, any]) => ({
              module: key,
              canRead: val.view || false,
              canWrite: val.edit || val.create || false,
              canDelete: val.delete || false,
            })
          );
        }
      }
    }

    // DB 정보 반환
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: (role as UserRole) || UserRole.MANAGER,
      salonId: salonId,
      profileImage: userData.profile_image,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      isActive: userData.is_active ?? true,
      isOwner: isOwner,
      isApproved: isApproved,
      permissions: permissions,
    };

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}
