'use client';

import { memo } from 'react';
import { Staff } from '../../types';
import { StaffTableHeader } from './StaffTableHeader';
import { StaffTableRow } from './StaffTableRow';

interface StaffTableProps {
  staffMembers: Staff[];
  isAdmin: boolean;
  canEdit: (member: Staff) => boolean;
  formatPhone: (phone?: string) => string;
  formatDate: (date: Date) => string;
  getRoleName: (role?: string) => string;
  onResign: (staffId: string) => void;
  onPermissionClick: (staff: Staff) => void;
  onProfileEdit: (staff: Staff) => void;
  onBookingToggle: (staffId: string, enabled: boolean) => void;
}

// rerender-memo: 테이블 컴포넌트 메모이제이션
export const StaffTable = memo(function StaffTable({
  staffMembers,
  isAdmin,
  canEdit,
  formatPhone,
  formatDate,
  getRoleName,
  onResign,
  onPermissionClick,
  onProfileEdit,
  onBookingToggle,
}: StaffTableProps) {
  return (
    <div className="bg-white rounded-lg border border-secondary-200">
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
              onResign={onResign}
              onPermissionClick={onPermissionClick}
              onProfileEdit={onProfileEdit}
              onBookingToggle={onBookingToggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default StaffTable;
