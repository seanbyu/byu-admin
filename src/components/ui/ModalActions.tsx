'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';

interface ModalActionsProps {
  onCancel: () => void;
  cancelLabel?: string;
  /** 기본값: isSaving */
  cancelDisabled?: boolean;

  /** onClick 기반 저장 */
  onSave?: () => void;
  /** form 기반 저장 — form="formId" 연결 */
  formId?: string;
  saveLabel?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;

  /** 왼쪽에 렌더링할 삭제 등 위험 액션 */
  destructiveAction?: React.ReactNode;
}

export const ModalActions = memo(function ModalActions({
  onCancel,
  cancelLabel,
  cancelDisabled,
  onSave,
  formId,
  saveLabel,
  isSaving = false,
  saveDisabled = false,
  destructiveAction,
}: ModalActionsProps) {
  const t = useTranslations();

  return (
    <div className={`flex items-center ${destructiveAction ? 'justify-between' : 'justify-end'}`}>
      {destructiveAction && <div>{destructiveAction}</div>}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={cancelDisabled ?? isSaving}
        >
          {cancelLabel ?? t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          type={formId ? 'submit' : 'button'}
          form={formId}
          onClick={!formId ? onSave : undefined}
          isLoading={isSaving}
          disabled={saveDisabled || isSaving}
        >
          {saveLabel ?? t('common.save')}
        </Button>
      </div>
    </div>
  );
});
