'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { deleteStaff, softDeleteStaff, cancelResignation } from '@/features/staff/actions';
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert(t('errors.loginRequired'));
          return;
        }

        const result = await softDeleteStaff({
          staffId,
          salonId,
          accessToken: session.access_token,
        });

        if (result.error) {
          handleResignError(result.error);
          return;
        }

        alert(t('success.softResigned'));
        refetch();
      } catch (err) {
        console.error(err);
        alert(t('errors.deleteFailed'));
      }
    },
    [salonId, refetch, t, handleResignError]
  );

  // 즉시 퇴사 처리 (완전 삭제)
  const handleImmediateResign = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.immediateResign'))) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert(t('errors.loginRequired'));
          return;
        }

        const result = await deleteStaff({
          staffId,
          salonId,
          accessToken: session.access_token,
        });

        if (result.error) {
          handleResignError(result.error);
          return;
        }

        alert(t('success.resigned'));
        refetch();
      } catch (err) {
        console.error(err);
        alert(t('errors.deleteFailed'));
      }
    },
    [salonId, refetch, t, handleResignError]
  );

  // 퇴사 예정 취소
  const handleCancelResignation = useCallback(
    async (staffId: string) => {
      if (!confirm(t('confirm.cancelResignation'))) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert(t('errors.loginRequired'));
          return;
        }

        const result = await cancelResignation({
          staffId,
          salonId,
          accessToken: session.access_token,
        });

        if (result.error) {
          alert(result.error);
          return;
        }

        alert(t('success.resignationCancelled'));
        refetch();
      } catch (err) {
        console.error(err);
        alert(t('errors.cancelFailed'));
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
    async (staffId: string, userId: string, newRole: string) => {
      try {
        // users 테이블의 role 업데이트
        const { error } = await supabase
          .from('users')
          .update({ role: newRole } as never)
          .eq('id', userId);

        if (error) {
          console.error('Error updating role:', error);
          alert(t('errors.updateFailed'));
          return;
        }

        refetch();
      } catch (err) {
        console.error(err);
        alert(t('errors.updateFailed'));
      }
    },
    [refetch, t]
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
