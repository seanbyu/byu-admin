'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const t = useTranslations('common');
  const confirmLabel = confirmText ?? t('confirm');
  const cancelLabel = cancelText ?? t('cancel');

  const Icon = variant === 'destructive' ? AlertTriangle : Info;
  const iconBgColor =
    variant === 'destructive' ? 'bg-error-100' : 'bg-primary-100';
  const iconColor =
    variant === 'destructive' ? 'text-error-600' : 'text-primary-600';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`p-3 rounded-full ${iconBgColor} mb-4`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-secondary-600 whitespace-pre-wrap mb-6">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
