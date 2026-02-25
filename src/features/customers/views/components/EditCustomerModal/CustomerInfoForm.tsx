'use client';

import { memo, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
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

  const handleStaffChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFormDataChange({ primary_artist_id: e.target.value });
    },
    [onFormDataChange]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-secondary-700">
          {t('customer.field.name')} <span className="text-error-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={handleChange('name')}
          placeholder={t('customer.edit.namePlaceholder')}
          className="h-10 text-sm md:h-11 md:text-base"
          required
        />
      </div>

      {/* Customer Number */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-secondary-700">
          {t('customer.field.customerNumber')}
        </label>
        <Input
          value={formData.customer_number}
          onChange={handleChange('customer_number')}
          placeholder={t('customer.create.customerNumberPlaceholder')}
          className="h-10 text-sm font-mono md:h-11 md:text-base"
        />
        <p className="mt-1 text-xs text-secondary-500">
          {t('customer.create.customerNumberHint')}
        </p>
      </div>

      {/* Customer Type */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-secondary-700">
          {t('customer.field.customerType')}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleCustomerTypeChange('local')}
            className={`h-10 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors md:h-11 md:text-base ${
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
            className={`h-10 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors md:h-11 md:text-base ${
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
        <label className="mb-1 block text-sm font-semibold text-secondary-700">
          {t('customer.field.primaryArtist')}
        </label>
        <select
          value={formData.primary_artist_id}
          onChange={handleStaffChange}
          className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 md:h-11 md:text-base ${
            errors.primary_artist_id ? 'border-error-500' : 'border-secondary-200'
          }`}
          disabled={isLoadingStaff}
        >
          <option value="">{t('customer.create.unassigned')}</option>
          {staffList.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name} {staff.positionTitle && `(${staff.positionTitle})`}
            </option>
          ))}
        </select>
        {errors.primary_artist_id && (
          <p className="mt-1 text-xs text-error-500">{errors.primary_artist_id}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-secondary-700">
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
        <label className="mb-1 block text-sm font-semibold text-secondary-700">
          {t('customer.field.email')}
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder={t('customer.edit.emailPlaceholder')}
          className="h-10 text-sm md:h-11 md:text-base"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-secondary-700">
          {t('customer.field.notes')}
        </label>
        <textarea
          value={formData.notes}
          onChange={handleChange('notes')}
          placeholder={t('customer.edit.notesPlaceholder')}
          rows={3}
          className="w-full rounded-lg border border-secondary-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 md:text-base"
        />
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="mb-1 text-sm font-semibold text-error-800 md:text-base">
            {t('customer.delete.confirm')}
          </p>
          <p className="mb-3 text-xs text-error-600 md:text-sm">
            {t('customer.delete.warning')}
          </p>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => onShowDeleteConfirm(false)}
              className="h-10 px-3 text-sm md:h-11 md:px-4 md:text-base"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={isDeleting}
              onClick={onDelete}
              className="h-10 px-3 text-sm md:h-11 md:px-4 md:text-base"
            >
              {t('customer.delete.button')}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 md:pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onShowDeleteConfirm(true)}
          disabled={showDeleteConfirm}
          className="h-10 px-2.5 text-sm text-error-600 hover:bg-error-50 hover:text-error-700 md:h-11 md:px-3 md:text-base"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          {t('customer.delete.button')}
        </Button>
        <div className="flex space-x-2 md:space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 min-w-[72px] px-3 text-sm md:h-11 md:min-w-[84px] md:text-base"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={isUpdating}
            className="h-10 min-w-[72px] px-3 text-sm md:h-11 md:min-w-[84px] md:text-base"
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  );
});
