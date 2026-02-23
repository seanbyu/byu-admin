'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCommonActionLabels } from '@/hooks/useCommonActionLabels';
import { formatPhoneDisplay } from '@/lib/utils';

interface NewCustomerConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  customerPhone: string;
  isLoading: boolean;
}

function NewCustomerConfirmModalComponent({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  customerPhone,
  isLoading,
}: NewCustomerConfirmModalProps) {
  const t = useTranslations();
  const actions = useCommonActionLabels();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('booking.newCustomerConfirm.title') || '신규 고객'}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-secondary-600">
          {t('booking.newCustomerConfirm.message') || '신규 고객입니다. 저장하시겠습니까?'}
        </p>
        <div className="p-3 bg-secondary-50 rounded-md">
          <div className="text-sm">
            <span className="font-medium">{t('customer.name')}:</span> {customerName}
          </div>
          <div className="text-sm">
            <span className="font-medium">{t('customer.phone')}:</span> {formatPhoneDisplay(customerPhone)}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {actions.cancel}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('common.saving') : actions.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export const NewCustomerConfirmModal = memo(NewCustomerConfirmModalComponent);
