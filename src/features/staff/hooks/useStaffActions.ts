'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
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
  const toast = useToast();

  // 기본 업데이트 핸들러
  const handleUpdateStaff = useCallback(
    async (staffId: string, updates: Partial<Staff>) => {
      try {
        await updateStaff({ staffId, updates });
      } catch (err) {
        console.error(err);
        toast.error(t('errors.updateFailed'));
      }
    },
    [updateStaff, t, toast]
  );

  // 에러 처리 헬퍼
  const handleResignError = useCallback((error: string) => {
    if (error === 'ERROR_CANNOT_DELETE_SELF') {
      toast.error(t('errors.cannotDeleteSelf'));
    } else if (error === 'ERROR_CANNOT_DELETE_OWNER') {
      toast.error(t('errors.cannotDeleteOwner'));
    } else {
      toast.error(error);
    }
  }, [t, toast]);

  // 퇴사 예정 처리 (1주일 유예)
  const handleSoftResign = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.softResign'))) return;

      try {
        await staffApi.softDelete(salonId, staffId);
        toast.success(t('success.softResigned'));
        refetch();
      } catch (err: any) {
        console.error(err);
        handleResignError(err.message || t('errors.deleteFailed'));
      }
    },
    [salonId, refetch, t, toast, handleResignError]
  );

  // 즉시 퇴사 처리 (완전 삭제)
  const handleImmediateResign = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.immediateResign'))) return;

      try {
        await staffApi.hardDelete(salonId, staffId);
        toast.success(t('success.resigned'));
        refetch();
      } catch (err: any) {
        console.error(err);
        handleResignError(err.message || t('errors.deleteFailed'));
      }
    },
    [salonId, refetch, t, toast, handleResignError]
  );

  // 퇴사 예정 취소
  const handleCancelResignation = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.cancelResignation'))) return;

      try {
        await staffApi.cancelResignation(salonId, staffId);
        toast.success(t('success.resignationCancelled'));
        refetch();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || t('errors.cancelFailed'));
      }
    },
    [salonId, refetch, t, toast]
  );

  // 예약 허용 토글
  const handleBookingToggle = useCallback(
    (staffId: string, enabled: boolean) => {
      handleUpdateStaff(staffId, { isBookingEnabled: enabled });
    },
    [handleUpdateStaff]
  );

  // 권한 저장 — optimistic update가 이미 적용되므로 모달 먼저 닫고 background 저장
  const handlePermissionSave = useCallback(
    async (id: string, permissions: StaffPermission[]) => {
      clearSelectedStaff();
      try {
        await updateStaff({ staffId: id, updates: { permissions } });
        toast.success(t('success.permissionSaved'));
      } catch (err) {
        console.error(err);
        toast.error(t('errors.updateFailed'));
      }
    },
    [updateStaff, clearSelectedStaff, t, toast]
  );

  // 프로필 저장 — optimistic update가 이미 적용되므로 모달 먼저 닫고 background 저장
  const handleProfileSave = useCallback(
    async (id: string, updates: Partial<Staff>) => {
      try {
        await updateStaff({ staffId: id, updates });
        toast.success(t('success.profileSaved'));
      } catch (err) {
        console.error(err);
        toast.error(t('profileModal.updateFailed'));
      }
    },
    [updateStaff, t, toast]
  );

  // 직원 생성 성공
  const handleCreateSuccess = useCallback(() => {
    toast.success(t('success.registered'));
    refetch();
  }, [refetch, t, toast]);

  // 역할 변경
  const handleRoleChange = useCallback(
    async (staffId: string, _userId: string, newRole: string) => {
      try {
        await staffApi.updateRole(salonId, staffId, newRole);
        refetch();
      } catch (err) {
        console.error(err);
        toast.error(t('errors.updateFailed'));
      }
    },
    [salonId, refetch, t, toast]
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
