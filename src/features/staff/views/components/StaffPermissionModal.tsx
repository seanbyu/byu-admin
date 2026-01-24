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

const MODULES = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'bookings', label: '예약 관리' },
  { key: 'customers', label: '고객 관리' },
  { key: 'staff', label: '직원 관리' },
  { key: 'services', label: '서비스 관리' },
  { key: 'reviews', label: '리뷰 관리' },
  { key: 'sales', label: '매출 관리' },
  { key: 'chat', label: '채팅' },
  { key: 'settings', label: '설정' },
];

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
      const initialPermissions = MODULES.map((module) => {
        const existing = staff.permissions?.find(
          (p) => p.module === module.key
        );
        return (
          existing || {
            module: module.key,
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
      alert('권한 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="권한 설정"
      size="lg" // Adjust size as needed, table works well with lg or xl
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      }
    >
      <div className="mb-4 text-sm text-gray-500">
        {staff.name}님의 관리자 권한을 설정합니다.
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              기능
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              조회
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              수정/등록
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              삭제
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {MODULES.map((module) => {
            const permission = permissions.find((p) => p.module === module.key);
            return (
              <tr key={module.key}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {module.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={permission?.canRead || false}
                    onChange={() => handleToggle(module.key, 'canRead')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={permission?.canWrite || false}
                    onChange={() => handleToggle(module.key, 'canWrite')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={permission?.canDelete || false}
                    onChange={() => handleToggle(module.key, 'canDelete')}
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
