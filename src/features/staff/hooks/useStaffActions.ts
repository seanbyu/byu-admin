'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Staff, StaffPermission } from '../types';

interface UseStaffActionsParams {
  updateStaff: (params: { staffId: string; updates: Partial<Staff> }) => Promise<unknown>;
  refetch: () => void;
  clearSelectedStaff: () => void;
}

interface UseStaffActionsReturn {
  handleUpdateStaff: (staffId: string, updates: Partial<Staff>) => Promise<void>;
  handleResign: (staffId: string) => void;
  handleBookingToggle: (staffId: string, enabled: boolean) => void;
  handlePermissionSave: (id: string, permissions: StaffPermission[]) => Promise<void>;
  handleProfileSave: (id: string, updates: Partial<Staff>) => Promise<void>;
  handleCreateSuccess: () => void;
}

export function useStaffActions({
  updateStaff,
  refetch,
  clearSelectedStaff,
}: UseStaffActionsParams): UseStaffActionsReturn {
  const t = useTranslations('staff');

  // 기본 업데이트 핸들러
  const handleUpdateStaff = useCallback(async (
    staffId: string,
    updates: Partial<Staff>
  ) => {
    try {
      await updateStaff({ staffId, updates });
    } catch (err) {
      console.error(err);
      alert(t('errors.updateFailed'));
    }
  }, [updateStaff, t]);

  // 퇴사 처리
  const handleResign = useCallback((staffId: string) => {
    handleUpdateStaff(staffId, { isActive: false });
  }, [handleUpdateStaff]);

  // 예약 허용 토글
  const handleBookingToggle = useCallback((staffId: string, enabled: boolean) => {
    handleUpdateStaff(staffId, { isBookingEnabled: enabled });
  }, [handleUpdateStaff]);

  // 권한 저장
  const handlePermissionSave = useCallback(async (id: string, permissions: StaffPermission[]) => {
    await handleUpdateStaff(id, { permissions });
    clearSelectedStaff();
  }, [handleUpdateStaff, clearSelectedStaff]);

  // 프로필 저장
  const handleProfileSave = useCallback(async (id: string, updates: Partial<Staff>) => {
    await handleUpdateStaff(id, updates);
  }, [handleUpdateStaff]);

  // 직원 생성 성공
  const handleCreateSuccess = useCallback(() => {
    alert(t('success.registered'));
    refetch();
  }, [refetch, t]);

  return {
    handleUpdateStaff,
    handleResign,
    handleBookingToggle,
    handlePermissionSave,
    handleProfileSave,
    handleCreateSuccess,
  };
}
