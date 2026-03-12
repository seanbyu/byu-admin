'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { useStaff } from '../hooks/useStaff';
import { useStaffPageState, useStaffPermissions } from '../hooks/useStaffPageState';
import { useStaffActions } from '../hooks/useStaffActions';
import { TablePageSkeleton } from '@/components/ui/Skeleton';
import { StaffPageHeader } from './components/StaffPageHeader';
import { StaffTable } from './components/StaffTable';

// bundle-dynamic-imports: 모달은 초기 로드에 필요하지 않으므로 동적 임포트
const CreateStaffModal = dynamic(
  () => import('./components/CreateStaffModal'),
  { ssr: false }
);

const StaffPermissionModal = dynamic(
  () => import('./components/StaffPermissionModal'),
  { ssr: false }
);

const StaffProfileModal = dynamic(
  () => import('./components/StaffProfileModal/index'),
  { ssr: false }
);

// rendering-hoist-jsx: 모달 로딩 폴백
const ModalFallback = null;

export default function StaffPageView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // 권한 체크
  const { canWrite, canDelete, isAdmin } = usePermission();
  const canWriteStaff = canWrite(PermissionModules.STAFF);
  const canDeleteStaff = canDelete(PermissionModules.STAFF);

  // Custom hooks로 상태 관리 분리 (Zustand 기반)
  const pageState = useStaffPageState();
  const { canEdit } = useStaffPermissions(user?.id, user?.role);

  // 데이터 fetching (TanStack Query)
  const {
    staffData,
    isLoading,
    error,
    updateStaff,
    refetch,
  } = useStaff(salonId, {
    enabled: !!salonId,
  });

  // staffMembers는 이미 useStaff에서 메모이제이션됨
  const staffMembers = staffData;

  // 비즈니스 로직 핸들러
  const staffActions = useStaffActions({
    salonId,
    updateStaff,
    refetch,
  });

  // 현재 직원 수 메모이제이션
  const currentStaffCount = useMemo(() => staffMembers.length, [staffMembers.length]);

  // js-early-exit: 로딩 상태 조기 반환
  if (isLoading) {
    return <TablePageSkeleton />;
  }

  // js-early-exit: 에러 상태 조기 반환
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-error-500">
          {t('common.error')}: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 xl:space-y-6">
        {/* Header */}
        <StaffPageHeader
          isAdmin={isAdmin}
          onInviteClick={pageState.openInviteModal}
          canAddStaff={isAdmin}
        />

        {/* Staff Table */}
        <StaffTable
          staffMembers={staffMembers}
          isAdmin={isAdmin}
          canEdit={canEdit}
          formatPhone={pageState.formatPhone}
          formatDate={pageState.formatDate}
          getRoleName={pageState.getRoleName}
          onSoftResign={canDeleteStaff ? staffActions.handleSoftResign : undefined}
          onImmediateResign={canDeleteStaff ? staffActions.handleImmediateResign : undefined}
          onCancelResignation={canWriteStaff ? staffActions.handleCancelResignation : undefined}
          onPermissionClick={pageState.selectStaffForPermission}
          onProfileEdit={canWriteStaff ? pageState.selectStaffForProfileEdit : undefined}
          onRoleChange={canWriteStaff ? staffActions.handleRoleChange : undefined}
        />

        {/* Modals - Suspense로 로딩 최적화 */}
        <Suspense fallback={ModalFallback}>
          {pageState.showInviteModal && (
            <CreateStaffModal
              isOpen={pageState.showInviteModal}
              onClose={pageState.closeInviteModal}
              onSuccess={staffActions.handleCreateSuccess}
              salonId={salonId}
              currentStaffCount={currentStaffCount}
            />
          )}

          {pageState.selectedStaff && (
            <StaffPermissionModal
              isOpen={!!pageState.selectedStaff}
              onClose={pageState.clearSelectedStaff}
              staff={pageState.selectedStaff}
              onSave={staffActions.handlePermissionSave}
              readOnly={!isAdmin}
            />
          )}

          {pageState.editingProfileStaff && (
            <StaffProfileModal
              isOpen={!!pageState.editingProfileStaff}
              onClose={pageState.clearEditingProfileStaff}
              staff={pageState.editingProfileStaff}
              onSave={staffActions.handleProfileSave}
            />
          )}
        </Suspense>
      </div>
  );
}
