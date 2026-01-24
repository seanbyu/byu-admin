/**
 * Supabase 인증 서비스
 */

import { supabase as _supabase } from './supabase/client';
import { User, UserRole } from '@/types';

const supabase = _supabase as any;

interface AuthResponse {
  user: User | null;
  token: string | null;
  error?: string;
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
      };
    }

    if (!authData.user || !authData.session) {
      return {
        user: null,
        token: null,
        error: '로그인에 실패했습니다',
      };
    }

    // users 테이블에서 추가 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      // users 테이블에 데이터가 없는 경우, auth.users의 기본 정보로 User 객체 생성
      // 기본 role을 SALON_MANAGER로 설정 (임시)
      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name:
          authData.user.user_metadata?.name ||
          authData.user.email!.split('@')[0],
        phone: authData.user.user_metadata?.phone || '',
        role:
          (authData.user.user_metadata?.role as UserRole) || UserRole.MANAGER,
        salonId: authData.user.user_metadata?.salon_id,
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

    // salon_id 확인 및 검증
    let salonId = userData.salon_id;
    let permissions: any[] = []; // StaffPermission[] but import might be circular or messy, using any[] and casting for now or strict type if possible

    if (salonId) {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id')
        .eq('id', salonId)
        .single();

      if (salonError || !salonData) {
        console.warn('Salon not found for user:', userData.id);
        salonId = undefined;
      } else {
        const role = userData.role?.toUpperCase();
        if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'STAFF') {
          console.warn(
            'User has salon_id but invalid role for salon access:',
            role
          );
        }

        // 직원 권한 조회 (staff_profiles 테이블)
        if (role === 'MANAGER' || role === 'STAFF' || role === 'ADMIN') {
          const { data: profileData } = await supabase
            .from('staff_profiles')
            .select('permissions')
            .eq('user_id', userData.id)
            .single();

          if (profileData && profileData.permissions) {
            // Transform JSON permissions to Array format
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
    }

    // users 테이블 데이터를 User 타입으로 변환
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      // Normalize role to uppercase and fallback to SALON_MANAGER if missing
      role: (userData.role?.toUpperCase() as UserRole) || UserRole.MANAGER,
      salonId: salonId,
      profileImage: userData.profile_image,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      isActive: userData.is_active ?? true,
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
      error: '로그인 중 오류가 발생했습니다',
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
      };
    }

    if (!authData.user) {
      return {
        user: null,
        token: null,
        error: '회원가입에 실패했습니다',
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
      error: '회원가입 중 오류가 발생했습니다',
    };
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (error) {
    console.error('Signout error:', error);
    return { error: '로그아웃 중 오류가 발생했습니다' };
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
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: '비밀번호 재설정 이메일 전송 중 오류가 발생했습니다' };
  }
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Update password error:', error);
    return { error: '비밀번호 업데이트 중 오류가 발생했습니다' };
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

    // salon_id 확인 및 검증
    let salonId = userData.salon_id;
    let permissions: any[] = [];

    if (salonId) {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id')
        .eq('id', salonId)
        .single();

      if (salonError || !salonData) {
        console.warn('Salon not found for user:', userData.id);
        salonId = undefined;
      } else {
        // 롤 체크
        const role = userData.role?.toUpperCase();
        if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'STAFF') {
          console.warn(
            'User has salon_id but invalid role for salon access:',
            role
          );
        }

        // 직원 권한 조회 (staff_profiles 테이블)
        if (role === 'MANAGER' || role === 'STAFF' || role === 'ADMIN') {
          const { data: profileData } = await supabase
            .from('staff_profiles')
            .select('permissions')
            .eq('user_id', userData.id)
            .single();

          if (profileData && profileData.permissions) {
            // Transform JSON permissions to Array format
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
    }

    // DB 정보 반환
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: (userData.role?.toUpperCase() as UserRole) || UserRole.MANAGER,
      salonId: salonId,
      profileImage: userData.profile_image,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
      isActive: userData.is_active ?? true,
      permissions: permissions,
    };

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}
