'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { StaffPermission } from '@/features/staff/types';

type PermissionType = 'canRead' | 'canWrite' | 'canDelete';

interface UsePermissionReturn {
  /** 특정 모듈의 특정 권한 확인 */
  hasPermission: (module: string, type: PermissionType) => boolean;
  /** 특정 모듈의 조회 권한 */
  canRead: (module: string) => boolean;
  /** 특정 모듈의 수정/등록 권한 */
  canWrite: (module: string) => boolean;
  /** 특정 모듈의 삭제 권한 */
  canDelete: (module: string) => boolean;
  /** Admin 여부 (SUPER_ADMIN, ADMIN은 모든 권한) */
  isAdmin: boolean;
  /** 권한 배열 */
  permissions: StaffPermission[];
}

/**
 * 권한 체크 훅
 * - SUPER_ADMIN, ADMIN: 모든 권한 자동 부여
 * - 그 외: permissions 배열에서 확인
 */
export function usePermission(): UsePermissionReturn {
  const { user } = useAuthStore();

  const isAdmin = useMemo(() => {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  }, [user?.role]);

  const permissions = useMemo(() => {
    return user?.permissions || [];
  }, [user?.permissions]);

  const hasPermission = useCallback(
    (module: string, type: PermissionType): boolean => {
      // Admin은 모든 권한
      if (isAdmin) return true;

      const perm = permissions.find((p) => p.module === module);
      if (!perm) return false;

      return perm[type] ?? false;
    },
    [isAdmin, permissions]
  );

  const canRead = useCallback(
    (module: string): boolean => hasPermission(module, 'canRead'),
    [hasPermission]
  );

  const canWrite = useCallback(
    (module: string): boolean => hasPermission(module, 'canWrite'),
    [hasPermission]
  );

  const canDelete = useCallback(
    (module: string): boolean => hasPermission(module, 'canDelete'),
    [hasPermission]
  );

  return useMemo(
    () => ({
      hasPermission,
      canRead,
      canWrite,
      canDelete,
      isAdmin,
      permissions,
    }),
    [hasPermission, canRead, canWrite, canDelete, isAdmin, permissions]
  );
}

// 모듈 키 상수 (타입 안전성)
export const PermissionModules = {
  DASHBOARD: 'dashboard',
  BOOKINGS: 'bookings',
  CUSTOMERS: 'customers',
  STAFF: 'staff',
  MENUS: 'menus',
  REVIEWS: 'reviews',
  SALES: 'sales',
  SETTINGS: 'settings',
} as const;

export type PermissionModule = (typeof PermissionModules)[keyof typeof PermissionModules];
