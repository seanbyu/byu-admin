'use client';

import { memo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Staff } from '../../types';

export interface StaffTableRowProps {
  member: Staff;
  index: number;
  isAdmin: boolean;
  canEdit: boolean;
  formatPhone: (phone?: string) => string;
  formatDate: (date: Date) => string;
  getRoleName: (role?: string) => string;
  onSoftResign?: (staffId: string) => void;
  onImmediateResign?: (staffId: string) => void;
  onCancelResignation?: (staffId: string) => void;
  onPermissionClick: (staff: Staff) => void;
  onProfileEdit?: (staff: Staff) => void;
  onRoleChange?: (staffId: string, userId: string, newRole: string) => void;
}

// 역할 옵션 (SUPER_ADMIN, ADMIN 제외)
const ROLE_OPTIONS = ['MANAGER', 'ARTIST', 'STAFF'] as const;

// rendering-hoist-jsx: 기본 프로필 아이콘 호이스팅
const DefaultProfileIcon = memo(function DefaultProfileIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
});

// 퇴사 예정까지 남은 일수 계산
function getDaysUntilDeletion(deletedAt: Date | string | null): number {
  if (!deletedAt) return 0;
  const deleted = new Date(deletedAt);
  const deletionDate = new Date(deleted);
  deletionDate.setDate(deletionDate.getDate() + 7);
  const now = new Date();
  const diff = deletionDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// rerender-memo: 테이블 행 컴포넌트 메모이제이션
export const StaffTableRow = memo(function StaffTableRow({
  member,
  index,
  isAdmin,
  canEdit,
  formatPhone,
  formatDate,
  getRoleName,
  onSoftResign,
  onImmediateResign,
  onCancelResignation,
  onPermissionClick,
  onProfileEdit,
  onRoleChange,
}: StaffTableRowProps) {
  const t = useTranslations('staff');
  const [resignAction, setResignAction] = useState('');

  // 퇴사 예정 상태 확인
  const isResigned = !member.isActive && member.deletedAt;
  const daysRemaining = isResigned
    ? getDaysUntilDeletion(member.deletedAt ?? null)
    : 0;

  const handleCancelResignationClick = useCallback(() => {
    onCancelResignation?.(member.id);
  }, [member.id, onCancelResignation]);

  const handlePermissionClick = useCallback(() => {
    onPermissionClick(member);
  }, [member, onPermissionClick]);

  const handleProfileEditClick = useCallback(() => {
    onProfileEdit?.(member);
  }, [member, onProfileEdit]);

  const handleResignActionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const action = e.target.value;
      setResignAction('');
      if (action === 'soft') {
        void onSoftResign?.(member.id);
      } else if (action === 'immediate') {
        void onImmediateResign?.(member.id);
      }
    },
    [member.id, onSoftResign, onImmediateResign]
  );

  const handleRoleSelect = useCallback((newRole: string) => {
    if (member.role !== newRole) {
      onRoleChange?.(member.id, member.userId, newRole);
    }
  }, [member.id, member.userId, member.role, onRoleChange]);

  // 퇴사 예정 직원은 다른 스타일로 표시
  const rowClassName = isResigned
    ? 'hover:bg-error-50 bg-error-50'
    : 'hover:bg-secondary-50';
  const tableActionButtonClass =
    'h-8 px-3 text-xs rounded-lg border-secondary-300 text-secondary-700 hover:bg-secondary-50';

  return (
    <tr className={rowClassName}>
      <td className="px-6 py-4 text-center text-sm text-secondary-900">
        {index + 1}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center space-x-3">
          <div className="relative">
            {member.profileImage ? (
              <img
                src={member.profileImage}
                alt=""
                className={`w-10 h-10 rounded-full object-cover border ${isResigned ? 'border-error-300 opacity-60' : 'border-secondary-200'}`}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isResigned ? 'bg-error-100 border-error-200 text-error-400' : 'bg-secondary-100 border-secondary-200 text-secondary-400'}`}>
                <span className="text-xs font-medium">
                  {member.name[0]}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isResigned ? 'bg-error-500' : member.isActive ? 'bg-success-500' : 'bg-secondary-300'
              }`}
            />
          </div>
          <div className="flex flex-col items-start">
            <span className={`text-sm font-medium ${isResigned ? 'text-error-600' : 'text-secondary-900'}`}>
              {member.name}
            </span>
            {isResigned && (
              <span className="text-xs text-error-500">
                {t('status.resignedDaysLeft', { days: daysRemaining })}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {member.email || '-'}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {formatPhone(member.phone)}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {member.role === 'ADMIN' || member.role === 'SUPER_ADMIN' ? '-' : formatDate(member.createdAt)}
      </td>
      <td className="px-6 py-4 text-center">
        {member.role !== 'SUPER_ADMIN' && member.role !== 'ADMIN' ? (
          isResigned ? (
            // 퇴사 예정 직원: 취소 버튼 표시
            onCancelResignation ? (
              <Button
                variant="outline"
                size="sm"
                className="text-primary-500 border-primary-200 hover:bg-primary-50 h-8 px-3 text-xs"
                onClick={handleCancelResignationClick}
              >
                {t('actions.cancelResignation')}
              </Button>
            ) : (
              <span className="text-secondary-400">-</span>
            )
          ) : onSoftResign || onImmediateResign ? (
            // 일반 직원: 네이티브 셀렉트로 퇴사 처리 (overflow 스크롤 이슈 방지)
            <Select
              value={resignAction}
              onChange={handleResignActionChange}
              className="h-8 min-w-[120px] px-2 text-xs border-error-200 text-error-500 focus:ring-error-200"
              placeholder={t('actions.resign')}
              options={[
                ...(onSoftResign
                  ? [{ value: 'soft', label: t('actions.softResign') }]
                  : []),
                ...(onImmediateResign
                  ? [{ value: 'immediate', label: t('actions.immediateResign') }]
                  : []),
              ]}
            />
          ) : (
            <span className="text-secondary-400">-</span>
          )
        ) : (
          <span className="text-secondary-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {member.role === 'SUPER_ADMIN' || member.role === 'ADMIN' ? (
          <Badge
            variant="default"
            className="h-8 px-3 text-xs rounded-lg border border-secondary-300 bg-secondary-50 text-secondary-500 font-medium"
          >
            {t('actions.allPermissions')}
          </Badge>
        ) : !isResigned ? (
          isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              className={tableActionButtonClass}
              onClick={handlePermissionClick}
            >
              {t('actions.setPermissions')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={tableActionButtonClass}
              onClick={handlePermissionClick}
            >
              {t('actions.viewPermissions')}
            </Button>
          )
        ) : (
          <span className="text-secondary-400 text-xs">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-center flex justify-center">
        {canEdit && !isResigned && onProfileEdit ? (
          <Button
            variant="outline"
            size="sm"
            className={`${tableActionButtonClass} cursor-pointer focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0`}
            onClick={handleProfileEditClick}
          >
            {t('actions.edit')}
          </Button>
        ) : member.profileImage ? (
          <img
            src={member.profileImage}
            alt=""
            className={`w-8 h-8 rounded-full ${isResigned ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isResigned ? 'bg-error-100 text-error-400' : 'bg-secondary-200 text-secondary-400'}`}>
            <DefaultProfileIcon />
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {member.role === 'SUPER_ADMIN' || member.role === 'ADMIN' ? (
          // SUPER_ADMIN, ADMIN은 변경 불가
          <span>{getRoleName(member.role)}</span>
        ) : isAdmin && !isResigned && onRoleChange ? (
          // Admin 유저: 네이티브 셀렉트로 역할 변경 (overflow 스크롤 이슈 방지)
          <Select
            value={member.role}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="h-8 min-w-[110px] text-sm bg-transparent border-0 focus:ring-0 pr-5 cursor-pointer"
            showPlaceholder={false}
            options={ROLE_OPTIONS.map((role) => ({
              value: role,
              label: getRoleName(role),
            }))}
          />
        ) : (
          // 일반 유저: 정적 표시
          <span>{getRoleName(member.role)}</span>
        )}
      </td>
    </tr>
  );
});

export default StaffTableRow;
