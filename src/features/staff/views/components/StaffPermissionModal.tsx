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
}

const MODULE_KEYS = [
  'dashboard',
  'bookings',
  'customers',
  'staff',
  'services',
  'reviews',
  'sales',
  'chat',
  'settings',
] as const;

export default function StaffPermissionModal({
  isOpen,
  onClose,
  staff,
  onSave,
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
    } catch (error) {
      console.error('Failed to save permissions', error);
      alert(t('staff.permissionModal.saveFailed'));
    } finally {
      setIsSaving(false);
    }
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
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="mb-4 text-sm text-gray-500">
        {t('staff.permissionModal.description', { name: staff.name })}
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {t('staff.permissionModal.feature')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {t('staff.permissionModal.view')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {t('staff.permissionModal.edit')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {t('staff.permissionModal.delete')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {MODULE_KEYS.map((moduleKey) => {
            const permission = permissions.find((p) => p.module === moduleKey);
            return (
              <tr key={moduleKey}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t(`staff.permissionLabels.${moduleKey}`)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={permission?.canRead || false}
                    onChange={() => handleToggle(moduleKey, 'canRead')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={permission?.canWrite || false}
                    onChange={() => handleToggle(moduleKey, 'canWrite')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={permission?.canDelete || false}
                    onChange={() => handleToggle(moduleKey, 'canDelete')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Modal>
  );
}
