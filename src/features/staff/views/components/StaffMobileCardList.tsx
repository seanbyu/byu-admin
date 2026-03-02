'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MoreVertical, X } from 'lucide-react';
import { Staff } from '../../types';

interface StaffMobileCardListProps {
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

interface ActionSheetProps {
  isOpen: boolean;
  staff: Staff | null;
  isResigned: boolean;
  isAdmin: boolean;
  onClose: () => void;
  getRoleName: (role?: string) => string;
  onSoftResign?: (staffId: string) => void;
  onImmediateResign?: (staffId: string) => void;
  onCancelResignation?: (staffId: string) => void;
  onRoleChange?: (staffId: string, userId: string, newRole: string) => void;
}

const ROLE_OPTIONS = ['MANAGER', 'ARTIST', 'STAFF'] as const;

function getDaysUntilDeletion(deletedAt: Date | string | null): number {
  if (!deletedAt) return 0;
  const deleted = new Date(deletedAt);
  const deletionDate = new Date(deleted);
  deletionDate.setDate(deletionDate.getDate() + 7);
  const now = new Date();
  const diff = deletionDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function StaffMobileActionSheet({
  isOpen,
  staff,
  isResigned,
  isAdmin,
  onClose,
  getRoleName,
  onSoftResign,
  onImmediateResign,
  onCancelResignation,
  onRoleChange,
}: ActionSheetProps) {
  const t = useTranslations();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const isProtectedRole =
    staff.role === 'SUPER_ADMIN' || staff.role === 'ADMIN';
  const canManageResignation =
    isAdmin &&
    !isProtectedRole &&
    (isResigned
      ? Boolean(onCancelResignation)
      : Boolean(onSoftResign || onImmediateResign));
  const canChangeRole =
    isAdmin && !isResigned && !isProtectedRole && Boolean(onRoleChange);

  const handleSoftResign = () => {
    onSoftResign?.(staff.id);
    onClose();
  };

  const handleImmediateResign = () => {
    onImmediateResign?.(staff.id);
    onClose();
  };

  const handleCancelResignation = () => {
    onCancelResignation?.(staff.id);
    onClose();
  };

  const handleRoleChange = (newRole: string) => {
    if (staff.role === newRole) {
      onClose();
      return;
    }
    onRoleChange?.(staff.id, staff.userId, newRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-3 sm:p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-secondary-200">
          <div>
            <p className="text-xs text-secondary-500">{t('staff.title')}</p>
            <p className="text-sm sm:text-base font-semibold text-secondary-900">
              {staff.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {canManageResignation && (
            <div className="space-y-2">
              {isResigned ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-primary-600 border-primary-200 hover:bg-primary-50"
                  onClick={handleCancelResignation}
                >
                  {t('staff.actions.cancelResignation')}
                </Button>
              ) : (
                <>
                  {onSoftResign && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11"
                      onClick={handleSoftResign}
                    >
                      {t('staff.actions.softResign')}
                    </Button>
                  )}
                  {onImmediateResign && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 text-error-600 border-error-200 hover:bg-error-50"
                      onClick={handleImmediateResign}
                    >
                      {t('staff.actions.immediateResign')}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {canChangeRole && (
            <div className="pt-2.5 sm:pt-3 border-t border-secondary-200">
              <p className="mb-2 text-xs sm:text-sm font-medium text-secondary-700">
                {t('staff.table.position')}
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant={staff.role === role ? 'primary' : 'outline'}
                    className="h-10 text-xs"
                    onClick={() => handleRoleChange(role)}
                  >
                    {getRoleName(role)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const StaffMobileCardList = memo(function StaffMobileCardList({
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
}: StaffMobileCardListProps) {
  const t = useTranslations();
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);

  const activeStaffIsResigned = useMemo(() => {
    if (!activeStaff) return false;
    return !activeStaff.isActive && Boolean(activeStaff.deletedAt);
  }, [activeStaff]);

  return (
    <>
      <div className="space-y-2 sm:space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-2 lg:gap-4">
        {staffMembers.map((member) => {
          const isResigned = !member.isActive && member.deletedAt;
          const daysRemaining = isResigned
            ? getDaysUntilDeletion(member.deletedAt ?? null)
            : 0;
          const isProtectedRole =
            member.role === 'SUPER_ADMIN' || member.role === 'ADMIN';
          const canManageResignation =
            isAdmin &&
            !isProtectedRole &&
            (isResigned
              ? Boolean(onCancelResignation)
              : Boolean(onSoftResign || onImmediateResign));
          const canChangeRole =
            isAdmin && !isResigned && !isProtectedRole && Boolean(onRoleChange);
          const hasManageActions = canManageResignation || canChangeRole;

          return (
            <article
              key={member.id}
              className={`rounded-xl border bg-white p-2.5 sm:p-4 ${
                isResigned ? 'border-error-200 bg-error-50' : 'border-secondary-200'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="relative shrink-0">
                  {member.profileImage ? (
                    <img
                      src={member.profileImage}
                      alt=""
                        className={`h-12 w-12 rounded-full object-cover border ${
                        isResigned
                          ? 'border-error-300 opacity-70'
                          : 'border-secondary-200'
                      }`}
                    />
                  ) : (
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium border ${
                        isResigned
                          ? 'bg-error-100 border-error-200 text-error-500'
                          : 'bg-secondary-100 border-secondary-200 text-secondary-500'
                      }`}
                    >
                      {member.name[0]}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      isResigned
                        ? 'bg-error-500'
                        : member.isActive
                          ? 'bg-success-500'
                          : 'bg-secondary-300'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isResigned ? 'text-error-600' : 'text-secondary-900'
                      }`}
                    >
                      {member.name}
                    </p>
                    <Badge size="sm">{getRoleName(member.role)}</Badge>
                  </div>
                  {isResigned ? (
                    <p className="mt-0.5 sm:mt-1 text-xs text-error-500">
                      {t('staff.status.resignedDaysLeft', { days: daysRemaining })}
                    </p>
                  ) : (
                    <p className="mt-0.5 sm:mt-1 truncate text-xs text-secondary-500">
                      {member.email || '-'}
                    </p>
                  )}
                </div>

                {hasManageActions && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    onClick={() => setActiveStaff(member)}
                    aria-label={t('common.calendar.more')}
                  >
                    <MoreVertical size={18} />
                  </Button>
                )}
              </div>

              <div className="mt-2.5 sm:mt-3 grid grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-1.5 sm:gap-y-2 text-xs">
                <div>
                  <p className="text-secondary-500">{t('staff.table.phone')}</p>
                  <p className="mt-0.5 text-secondary-800">
                    {formatPhone(member.phone)}
                  </p>
                </div>
                <div>
                  <p className="text-secondary-500">{t('staff.table.joinDate')}</p>
                  <p className="mt-0.5 text-secondary-800">
                    {member.role === 'ADMIN' || member.role === 'SUPER_ADMIN'
                      ? '-'
                      : formatDate(member.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                {member.role === 'SUPER_ADMIN' || member.role === 'ADMIN' ? (
                  <Badge className="bg-secondary-100 text-secondary-500 font-normal">
                    {t('staff.actions.allPermissions')}
                  </Badge>
                ) : !isResigned ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={isAdmin ? 'bg-secondary-800 text-white hover:bg-secondary-700 border-transparent' : ''}
                    onClick={() => onPermissionClick(member)}
                  >
                    {isAdmin
                      ? t('staff.actions.setPermissions')
                      : t('staff.actions.viewPermissions')}
                  </Button>
                ) : null}

                {canEdit(member) && !isResigned && onProfileEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={() => onProfileEdit(member)}
                  >
                    {t('staff.actions.edit')}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <StaffMobileActionSheet
        isOpen={Boolean(activeStaff)}
        staff={activeStaff}
        isResigned={activeStaffIsResigned}
        isAdmin={isAdmin}
        onClose={() => setActiveStaff(null)}
        getRoleName={getRoleName}
        onSoftResign={onSoftResign}
        onImmediateResign={onImmediateResign}
        onCancelResignation={onCancelResignation}
        onRoleChange={onRoleChange}
      />
    </>
  );
});

export default StaffMobileCardList;
