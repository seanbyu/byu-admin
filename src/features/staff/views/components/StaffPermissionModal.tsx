import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Staff, StaffPermission } from '../../types';
import { useTranslations } from 'next-intl';

interface StaffPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  onSave: (staffId: string, permissions: StaffPermission[]) => Promise<void>;
  readOnly?: boolean;
}

// 권한 모듈 키 (사이드바와 동기화)
const MODULE_KEYS = [
  'dashboard',
  'bookings',
  'customers',
  'booking_settings',
  'my_schedule',
  'staff',
  'menus',
  'reviews',
  'sales',
  'settings',
] as const;

// 삭제 열이 해당없는 모듈
const NO_DELETE_MODULES = new Set(['booking_settings', 'my_schedule']);
// 수정/등록 열이 해당없는 모듈 (조회만 가능)
const NO_WRITE_MODULES = new Set(['booking_settings']);

// 메뉴 구조 정의 (사이드바와 동일한 구조)
interface PermissionMenuItem {
  key: typeof MODULE_KEYS[number];
  isSubItem?: boolean;
  isDeepSubItem?: boolean; // 2단계 들여쓰기
}

interface PermissionMenuGroup {
  groupKey: string;
  items: PermissionMenuItem[];
}

type PermissionMenuEntry = PermissionMenuItem | PermissionMenuGroup;

// 사이드바 순서와 동일하게 구성
const MENU_STRUCTURE: PermissionMenuEntry[] = [
  { key: 'dashboard' },
  { key: 'bookings' },
  { key: 'customers' },
  {
    groupKey: 'salonManagement',
    items: [
      { key: 'booking_settings', isSubItem: true },
      { key: 'my_schedule', isSubItem: true, isDeepSubItem: true },
      { key: 'staff', isSubItem: true },
      { key: 'menus', isSubItem: true },
      { key: 'reviews', isSubItem: true },
      { key: 'sales', isSubItem: true },
    ],
  },
  { key: 'settings' },
];

// Type guard for group
function isMenuGroup(entry: PermissionMenuEntry): entry is PermissionMenuGroup {
  return 'groupKey' in entry;
}

export default function StaffPermissionModal({
  isOpen,
  onClose,
  staff,
  onSave,
  readOnly = false,
}: StaffPermissionModalProps) {
  const t = useTranslations();
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      // Initialize permissions from staff or defaults
      const initialPermissions = MODULE_KEYS.map((moduleKey) => {
        const existing = staff.permissions?.find(
          (p) => p.module === moduleKey
        );
        return (
          existing || {
            module: moduleKey,
            canRead: false,
            canWrite: false,
            canDelete: false,
          }
        );
      });
      setPermissions(initialPermissions);
    }
  }, [staff]);

  const handleToggle = (
    moduleKey: string,
    field: 'canRead' | 'canWrite' | 'canDelete'
  ) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === moduleKey ? { ...p, [field]: !p[field] } : p
      )
    );
  };

  const handleSave = async () => {
    if (!staff) return;
    setIsSaving(true);
    try {
      await onSave(staff.id, permissions);
      onClose();
    } catch {
      // 에러 toast는 useStaffActions에서 처리
    } finally {
      setIsSaving(false);
    }
  };

  // 권한 행 렌더링
  const renderPermissionRow = (moduleKey: string, isSubItem?: boolean, isDeepSubItem?: boolean) => {
    const permission = permissions.find((p) => p.module === moduleKey);
    const noDelete = NO_DELETE_MODULES.has(moduleKey);
    const noWrite = NO_WRITE_MODULES.has(moduleKey);
    const checkboxClass = readOnly
      ? 'h-4 w-4 text-primary-600 border-secondary-300 rounded cursor-not-allowed opacity-60'
      : 'h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded cursor-pointer';
    const disabledCheckboxClass = 'h-4 w-4 border-secondary-200 rounded cursor-not-allowed opacity-30';

    let paddingLeft = '';
    if (isDeepSubItem) paddingLeft = 'pl-16';
    else if (isSubItem) paddingLeft = 'pl-10';

    return (
      <tr key={moduleKey} className={isSubItem ? 'bg-secondary-50' : ''}>
        <td className={`px-6 py-3 whitespace-nowrap text-sm font-medium text-secondary-900 ${paddingLeft}`}>
          {isSubItem && <span className="text-secondary-300 mr-2">└</span>}
          {t(`staff.permissionLabels.${moduleKey}`)}
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-center">
          <input
            type="checkbox"
            checked={permission?.canRead || false}
            onChange={() => !readOnly && handleToggle(moduleKey, 'canRead')}
            disabled={readOnly}
            className={checkboxClass}
          />
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-center">
          {noWrite ? (
            <input type="checkbox" checked={false} disabled className={disabledCheckboxClass} />
          ) : (
            <input
              type="checkbox"
              checked={permission?.canWrite || false}
              onChange={() => !readOnly && handleToggle(moduleKey, 'canWrite')}
              disabled={readOnly}
              className={checkboxClass}
            />
          )}
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-center">
          {noDelete ? (
            <input type="checkbox" checked={false} disabled className={disabledCheckboxClass} />
          ) : (
            <input
              type="checkbox"
              checked={permission?.canDelete || false}
              onChange={() => !readOnly && handleToggle(moduleKey, 'canDelete')}
              disabled={readOnly}
              className={checkboxClass}
            />
          )}
        </td>
      </tr>
    );
  };

  // 그룹 헤더 렌더링
  const renderGroupHeader = (groupKey: string) => {
    return (
      <tr key={groupKey} className="bg-secondary-100">
        <td
          colSpan={4}
          className="px-6 py-2 text-sm font-semibold text-secondary-700"
        >
          {t(`staff.permissionLabels.${groupKey}`)}
        </td>
      </tr>
    );
  };

  if (!isOpen || !staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('staff.permissionModal.title')}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {readOnly ? t('common.close') : t('common.cancel')}
          </Button>
          {!readOnly && (
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {t('common.save')}
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-4 text-sm text-secondary-500">
        {t('staff.permissionModal.description', { name: staff.name })}
      </div>
      <div className="border border-secondary-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
              >
                {t('staff.permissionModal.feature')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-20"
              >
                {t('staff.permissionModal.view')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-24"
              >
                {t('staff.permissionModal.edit')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-20"
              >
                {t('staff.permissionModal.delete')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {MENU_STRUCTURE.map((entry) => {
              if (isMenuGroup(entry)) {
                return (
                  <React.Fragment key={entry.groupKey}>
                    {renderGroupHeader(entry.groupKey)}
                    {entry.items.map((item) =>
                      renderPermissionRow(item.key, item.isSubItem, item.isDeepSubItem)
                    )}
                  </React.Fragment>
                );
              }
              return renderPermissionRow(entry.key);
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
