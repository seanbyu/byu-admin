'use client';

import { memo, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import type { CustomerInfoFormProps, CustomerFormData } from './types';

export const CustomerInfoForm = memo(function CustomerInfoForm({
  formData,
  errors = {},
  isUpdating,
  isDeleting,
  showDeleteConfirm,
  staffList,
  isLoadingStaff,
  canWrite = true,
  canDelete = false,
  onFormDataChange,
  onSubmit,
  onDelete,
  onShowDeleteConfirm,
  onClose,
}: CustomerInfoFormProps) {
  const t = useTranslations();

  const handleChange = useCallback(
    (field: keyof CustomerFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;

        // 고객번호는 숫자만 허용
        if (field === 'customer_number') {
          if (value && !/^\d*$/.test(value)) return;
        }

        onFormDataChange({ [field]: value });
      },
    [onFormDataChange]
  );

  const handleCustomerTypeChange = useCallback(
    (type: 'local' | 'foreign') => {
      onFormDataChange({ customer_type: type });
    },
    [onFormDataChange]
  );

  const handlePhoneChange = useCallback(
    (value: string) => {
      onFormDataChange({ phone: value });
    },
    [onFormDataChange]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-700">
          {t('customer.field.name')} <span className="text-error-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={handleChange('name')}
          placeholder={t('customer.edit.namePlaceholder')}
          className="h-9 text-sm"
          required
        />
      </div>

      {/* Customer Number */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-700">
          {t('customer.field.customerNumber')}
        </label>
        <Input
          value={formData.customer_number}
          onChange={handleChange('customer_number')}
          placeholder={t('customer.create.customerNumberPlaceholder')}
          className="h-9 text-sm font-mono"
        />
        <p className="mt-1 text-[11px] text-secondary-500">
          {t('customer.create.customerNumberHint')}
        </p>
      </div>

      {/* Customer Type */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-secondary-700">
          {t('customer.field.customerType')}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleCustomerTypeChange('local')}
            className={`h-9 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors ${
              formData.customer_type === 'local'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
            }`}
          >
            {t('customer.type.local')}
          </button>
          <button
            type="button"
            onClick={() => handleCustomerTypeChange('foreign')}
            className={`h-9 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors ${
              formData.customer_type === 'foreign'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
            }`}
          >
            {t('customer.type.foreign')}
          </button>
        </div>
      </div>

      {/* Primary Artist */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-700">
          {t('customer.field.primaryArtist')}
        </label>
        <Select
          value={formData.primary_artist_id}
          onChange={(e) => onFormDataChange({ primary_artist_id: e.target.value })}
          className="h-9 text-sm"
          error={errors.primary_artist_id}
          placeholder={t('customer.create.unassigned')}
          options={staffList.map((staff) => ({
            value: staff.id,
            label: `${staff.name}${staff.positionTitle ? ` (${staff.positionTitle})` : ''}`,
          }))}
          disabled={isLoadingStaff}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-700">
          {t('customer.field.phone')} {formData.customer_type === 'local' && <span className="text-error-500">*</span>}
        </label>
        <PhoneInput
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="08X-XXX-XXXX"
          defaultCountryCode="+66"
          error={errors.phone}
        />
      </div>

      {/* Email */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-700">
          {t('customer.field.email')}
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder={t('customer.edit.emailPlaceholder')}
          className="h-9 text-sm"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-secondary-700">
          {t('customer.field.notes')}
        </label>
        <Textarea
          value={formData.notes}
          onChange={handleChange('notes')}
          placeholder={t('customer.edit.notesPlaceholder')}
          rows={3}
          className="text-sm"
        />
      </div>

      {/* Delete Confirmation */}
      {canDelete && showDeleteConfirm && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3">
          <p className="mb-1 text-sm font-semibold text-error-800">
            {t('customer.delete.confirm')}
          </p>
          <p className="mb-2.5 text-xs text-error-600">
            {t('customer.delete.warning')}
          </p>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onShowDeleteConfirm(false)}
              className="h-8 px-3 text-xs"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={onDelete}
              className="h-8 px-3 text-xs"
            >
              {t('customer.delete.button')}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2">
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onShowDeleteConfirm(true)}
            disabled={showDeleteConfirm}
            className="h-8 px-2 text-xs text-error-600 hover:bg-error-50 hover:text-error-700"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {t('customer.delete.button')}
          </Button>
        )}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8 min-w-[60px] px-3 text-xs"
          >
            {t('common.cancel')}
          </Button>
          {canWrite && (
            <Button
              type="submit"
              isLoading={isUpdating}
              className="h-8 min-w-[60px] px-3 text-xs"
            >
              {t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
});
