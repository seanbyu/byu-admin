'use client';

import { memo } from 'react';
import { Staff } from '../../types';
import { StaffTableHeader } from './StaffTableHeader';
import { StaffTableRow } from './StaffTableRow';
import { StaffMobileCardList } from './StaffMobileCardList';

interface StaffTableProps {
  staffMembers: Staff[];
  isAdmin: boolean;
  canEdit: (member: Staff) => boolean;
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

// rerender-memo: 테이블 컴포넌트 메모이제이션
export const StaffTable = memo(function StaffTable({
  staffMembers,
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
}: StaffTableProps) {
  return (
    <>
      <div className="xl:hidden">
        <StaffMobileCardList
          staffMembers={staffMembers}
          isAdmin={isAdmin}
          canEdit={canEdit}
          formatPhone={formatPhone}
          formatDate={formatDate}
          getRoleName={getRoleName}
          onSoftResign={onSoftResign}
          onImmediateResign={onImmediateResign}
          onCancelResignation={onCancelResignation}
          onPermissionClick={onPermissionClick}
          onProfileEdit={onProfileEdit}
          onRoleChange={onRoleChange}
        />
      </div>

      <div className="hidden xl:block bg-white rounded-lg border border-secondary-200 overflow-x-auto">
        <table className="w-full">
          <StaffTableHeader />
          <tbody className="divide-y divide-secondary-200">
            {staffMembers.map((member, index) => (
              <StaffTableRow
                key={member.id}
                member={member}
                index={index}
                isAdmin={isAdmin}
                canEdit={canEdit(member)}
                formatPhone={formatPhone}
                formatDate={formatDate}
                getRoleName={getRoleName}
                onSoftResign={onSoftResign}
                onImmediateResign={onImmediateResign}
                onCancelResignation={onCancelResignation}
                onPermissionClick={onPermissionClick}
                onProfileEdit={onProfileEdit}
                onRoleChange={onRoleChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});

export default StaffTable;
