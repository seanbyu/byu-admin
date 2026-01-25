'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Staff } from '../../types';

export interface StaffTableRowProps {
  member: Staff;
  index: number;
  isAdmin: boolean;
  canEdit: boolean;
  formatPhone: (phone?: string) => string;
  formatDate: (date: Date) => string;
  getRoleName: (role?: string) => string;
  onResign: (staffId: string) => void;
  onPermissionClick: (staff: Staff) => void;
  onProfileEdit: (staff: Staff) => void;
  onBookingToggle: (staffId: string, enabled: boolean) => void;
}

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

// rerender-memo: 테이블 행 컴포넌트 메모이제이션
export const StaffTableRow = memo(function StaffTableRow({
  member,
  index,
  isAdmin,
  canEdit,
  formatPhone,
  formatDate,
  getRoleName,
  onResign,
  onPermissionClick,
  onProfileEdit,
  onBookingToggle,
}: StaffTableRowProps) {
  const t = useTranslations('staff');

  const handleResignClick = useCallback(() => {
    if (confirm(t('confirm.resign'))) {
      onResign(member.id);
    }
  }, [member.id, onResign, t]);

  const handlePermissionClick = useCallback(() => {
    onPermissionClick(member);
  }, [member, onPermissionClick]);

  const handleProfileEditClick = useCallback(() => {
    onProfileEdit(member);
  }, [member, onProfileEdit]);

  const handleBookingToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onBookingToggle(member.id, e.target.checked);
  }, [member.id, onBookingToggle]);

  return (
    <tr className="hover:bg-gray-50">
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
                className="w-10 h-10 rounded-full object-cover border border-secondary-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center border border-secondary-200 text-secondary-400">
                <span className="text-xs font-medium">
                  {member.name[0]}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                member.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>
          <span className="text-sm font-medium text-secondary-900">
            {member.name}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {member.email || '-'}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {formatPhone(member.phone)}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {formatDate(member.createdAt)}
      </td>
      <td className="px-6 py-4 text-center">
        {isAdmin && member.role !== 'SUPER_ADMIN' ? (
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50 h-8 px-3 text-xs"
            onClick={handleResignClick}
          >
            {t('actions.resign')}
          </Button>
        ) : (
          <span className="text-secondary-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {member.role === 'SUPER_ADMIN' || member.role === 'ADMIN' ? (
          <Badge
            variant="default"
            className="bg-gray-100 text-gray-500 font-normal"
          >
            {t('actions.allPermissions')}
          </Badge>
        ) : isAdmin ? (
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 text-white hover:bg-gray-700 h-8 px-3 text-xs rounded-full border-transparent"
            onClick={handlePermissionClick}
          >
            {t('actions.setPermissions')}
          </Button>
        ) : (
          <span className="text-secondary-400 text-xs">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-center flex justify-center">
        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleProfileEditClick}
          >
            {t('actions.editInfo')}
          </Button>
        ) : member.profileImage ? (
          <img
            src={member.profileImage}
            alt=""
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
            <DefaultProfileIcon />
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {getRoleName(member.role)}
      </td>
      <td className="px-6 py-4 text-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={member.isBookingEnabled}
            disabled={!canEdit}
            onChange={handleBookingToggle}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300" />
        </label>
      </td>
    </tr>
  );
});

export default StaffTableRow;
