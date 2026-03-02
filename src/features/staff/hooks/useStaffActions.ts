'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { staffApi } from '../api';
import { Staff, StaffPermission } from '../types';

interface UseStaffActionsParams {
  salonId: string;
  updateStaff: (params: { staffId: string; updates: Partial<Staff> }) => Promise<unknown>;
  refetch: () => void;
  clearSelectedStaff: () => void;
}

interface UseStaffActionsReturn {
  handleUpdateStaff: (staffId: string, updates: Partial<Staff>) => Promise<void>;
  handleSoftResign: (staffId: string) => Promise<void>;
  handleImmediateResign: (staffId: string) => Promise<void>;
  handleCancelResignation: (staffId: string) => Promise<void>;
  handleBookingToggle: (staffId: string, enabled: boolean) => void;
  handlePermissionSave: (id: string, permissions: StaffPermission[]) => Promise<void>;
  handleProfileSave: (id: string, updates: Partial<Staff>) => Promise<void>;
  handleCreateSuccess: () => void;
  handleRoleChange: (staffId: string, userId: string, newRole: string) => Promise<void>;
}

export function useStaffActions({
  salonId,
  updateStaff,
  refetch,
  clearSelectedStaff,
}: UseStaffActionsParams): UseStaffActionsReturn {
  const t = useTranslations('staff');

  // 기본 업데이트 핸들러
  const handleUpdateStaff = useCallback(
    async (staffId: string, updates: Partial<Staff>) => {
      try {
        await updateStaff({ staffId, updates });
      } catch (err) {
        console.error(err);
        alert(t('errors.updateFailed'));
      }
    },
    [updateStaff, t]
  );

  // 에러 처리 헬퍼
  const handleResignError = useCallback((error: string) => {
    if (error === 'ERROR_CANNOT_DELETE_SELF') {
      alert(t('errors.cannotDeleteSelf'));
    } else if (error === 'ERROR_CANNOT_DELETE_OWNER') {
      alert(t('errors.cannotDeleteOwner'));
    } else {
      alert(error);
    }
  }, [t]);

  // 퇴사 예정 처리 (1주일 유예)
  const handleSoftResign = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.softResign'))) return;

      try {
        await staffApi.softDelete(salonId, staffId);
        alert(t('success.softResigned'));
        refetch();
      } catch (err: any) {
        console.error(err);
        handleResignError(err.message || t('errors.deleteFailed'));
      }
    },
    [salonId, refetch, t, handleResignError]
  );

  // 즉시 퇴사 처리 (완전 삭제)
  const handleImmediateResign = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.immediateResign'))) return;

      try {
        await staffApi.hardDelete(salonId, staffId);
        alert(t('success.resigned'));
        refetch();
      } catch (err: any) {
        console.error(err);
        handleResignError(err.message || t('errors.deleteFailed'));
      }
    },
    [salonId, refetch, t, handleResignError]
  );

  // 퇴사 예정 취소
  const handleCancelResignation = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.cancelResignation'))) return;

      try {
        await staffApi.cancelResignation(salonId, staffId);
        alert(t('success.resignationCancelled'));
        refetch();
      } catch (err: any) {
        console.error(err);
        alert(err.message || t('errors.cancelFailed'));
      }
    },
    [salonId, refetch, t]
  );

  // 예약 허용 토글
  const handleBookingToggle = useCallback(
    (staffId: string, enabled: boolean) => {
      handleUpdateStaff(staffId, { isBookingEnabled: enabled });
    },
    [handleUpdateStaff]
  );

  // 권한 저장
  const handlePermissionSave = useCallback(
    async (id: string, permissions: StaffPermission[]) => {
      await handleUpdateStaff(id, { permissions });
      clearSelectedStaff();
    },
    [handleUpdateStaff, clearSelectedStaff]
  );

  // 프로필 저장 (에러 시 throw하여 모달에서 처리)
  const handleProfileSave = useCallback(
    async (id: string, updates: Partial<Staff>) => {
      await updateStaff({ staffId: id, updates });
    },
    [updateStaff]
  );

  // 직원 생성 성공
  const handleCreateSuccess = useCallback(() => {
    alert(t('success.registered'));
    refetch();
  }, [refetch, t]);

  // 역할 변경
  const handleRoleChange = useCallback(
    async (staffId: string, _userId: string, newRole: string) => {
      try {
        await staffApi.updateRole(salonId, staffId, newRole);
        refetch();
      } catch (err) {
        console.error(err);
        alert(t('errors.updateFailed'));
      }
    },
    [salonId, refetch, t]
  );

  return useMemo(
    () => ({
      handleUpdateStaff,
      handleSoftResign,
      handleImmediateResign,
      handleCancelResignation,
      handleBookingToggle,
      handlePermissionSave,
      handleProfileSave,
      handleCreateSuccess,
      handleRoleChange,
    }),
    [
      handleUpdateStaff,
      handleSoftResign,
      handleImmediateResign,
      handleCancelResignation,
      handleBookingToggle,
      handlePermissionSave,
      handleProfileSave,
      handleCreateSuccess,
      handleRoleChange,
    ]
  );
}
