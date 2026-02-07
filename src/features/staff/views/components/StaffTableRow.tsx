'use client';

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // 퇴사 예정 상태 확인
  const isResigned = !member.isActive && member.deletedAt;
  const daysRemaining = isResigned ? getDaysUntilDeletion(member.deletedAt) : 0;

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSoftResignClick = useCallback(() => {
    setIsDropdownOpen(false);
    onSoftResign?.(member.id);
  }, [member.id, onSoftResign]);

  const handleImmediateResignClick = useCallback(() => {
    setIsDropdownOpen(false);
    onImmediateResign?.(member.id);
  }, [member.id, onImmediateResign]);

  const handleCancelResignationClick = useCallback(() => {
    onCancelResignation?.(member.id);
  }, [member.id, onCancelResignation]);

  const handlePermissionClick = useCallback(() => {
    onPermissionClick(member);
  }, [member, onPermissionClick]);

  const handleProfileEditClick = useCallback(() => {
    onProfileEdit?.(member);
  }, [member, onProfileEdit]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const toggleRoleDropdown = useCallback(() => {
    setIsRoleDropdownOpen(prev => !prev);
  }, []);

  const handleRoleSelect = useCallback((newRole: string) => {
    setIsRoleDropdownOpen(false);
    if (member.role !== newRole) {
      onRoleChange?.(member.id, member.userId, newRole);
    }
  }, [member.id, member.userId, member.role, onRoleChange]);

  // 퇴사 예정 직원은 다른 스타일로 표시
  const rowClassName = isResigned
    ? 'hover:bg-red-50 bg-red-50/30'
    : 'hover:bg-gray-50';

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
                className={`w-10 h-10 rounded-full object-cover border ${isResigned ? 'border-red-300 opacity-60' : 'border-secondary-200'}`}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isResigned ? 'bg-red-100 border-red-200 text-red-400' : 'bg-secondary-100 border-secondary-200 text-secondary-400'}`}>
                <span className="text-xs font-medium">
                  {member.name[0]}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isResigned ? 'bg-red-500' : member.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>
          <div className="flex flex-col items-start">
            <span className={`text-sm font-medium ${isResigned ? 'text-red-600' : 'text-secondary-900'}`}>
              {member.name}
            </span>
            {isResigned && (
              <span className="text-xs text-red-500">
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
        {isAdmin && member.role !== 'SUPER_ADMIN' && member.role !== 'ADMIN' ? (
          isResigned ? (
            // 퇴사 예정 직원: 취소 버튼 표시
            onCancelResignation ? (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-500 border-blue-200 hover:bg-blue-50 h-8 px-3 text-xs"
                onClick={handleCancelResignationClick}
              >
                {t('actions.cancelResignation')}
              </Button>
            ) : (
              <span className="text-secondary-400">-</span>
            )
          ) : onSoftResign || onImmediateResign ? (
            // 일반 직원: 퇴사 드롭다운 메뉴
            <div className="relative inline-block" ref={dropdownRef}>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50 h-8 px-3 text-xs"
                onClick={toggleDropdown}
              >
                {t('actions.resign')}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  {onSoftResign && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md"
                      onClick={handleSoftResignClick}
                    >
                      {t('actions.softResign')}
                    </button>
                  )}
                  {onImmediateResign && (
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-md border-t border-gray-100"
                      onClick={handleImmediateResignClick}
                    >
                      {t('actions.immediateResign')}
                    </button>
                  )}
                </div>
              )}
            </div>
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
            className="bg-gray-100 text-gray-500 font-normal"
          >
            {t('actions.allPermissions')}
          </Badge>
        ) : !isResigned ? (
          isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 text-white hover:bg-gray-700 h-8 px-3 text-xs rounded-full border-transparent"
              onClick={handlePermissionClick}
            >
              {t('actions.setPermissions')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-full"
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
            className="h-8 px-3 text-xs"
            onClick={handleProfileEditClick}
          >
            {t('actions.editInfo')}
          </Button>
        ) : member.profileImage ? (
          <img
            src={member.profileImage}
            alt=""
            className={`w-8 h-8 rounded-full ${isResigned ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isResigned ? 'bg-red-100 text-red-400' : 'bg-gray-200 text-gray-400'}`}>
            <DefaultProfileIcon />
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-center text-sm text-secondary-600">
        {member.role === 'SUPER_ADMIN' || member.role === 'ADMIN' ? (
          // SUPER_ADMIN, ADMIN은 변경 불가
          <span>{getRoleName(member.role)}</span>
        ) : isAdmin && !isResigned && onRoleChange ? (
          // Admin 유저: 드롭다운으로 역할 변경 가능
          <div className="relative inline-block" ref={roleDropdownRef}>
            <button
              onClick={toggleRoleDropdown}
              className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900"
            >
              {getRoleName(member.role)}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                      member.role === role ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                    }`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    {getRoleName(role)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // 일반 유저: 정적 표시
          <span>{getRoleName(member.role)}</span>
        )}
      </td>
    </tr>
  );
});

export default StaffTableRow;
