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
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {t('customer.field.name')} <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={handleChange('name')}
          placeholder={t('customer.edit.namePlaceholder')}
          required
        />
      </div>

      {/* Customer Number */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {t('customer.field.customerNumber')}
        </label>
        <Input
          value={formData.customer_number}
          onChange={handleChange('customer_number')}
          placeholder={t('customer.create.customerNumberPlaceholder')}
          className="font-mono"
        />
        <p className="text-xs text-secondary-500 mt-1">
          {t('customer.create.customerNumberHint')}
        </p>
      </div>

      {/* Customer Type */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {t('customer.field.customerType')}
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleCustomerTypeChange('local')}
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
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
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
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
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {t('customer.field.primaryArtist')}
        </label>
        <select
          value={formData.primary_artist_id}
          onChange={handleStaffChange}
          className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isLoadingStaff}
        >
          <option value="">{t('customer.create.selectArtist')}</option>
          {staffList.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name} {staff.positionTitle && `(${staff.positionTitle})`}
            </option>
          ))}
        </select>
      </div>

      {/* Phone */}
      <div>
        <PhoneInput
          value={formData.phone}
          onChange={handlePhoneChange}
          label={t('customer.field.phone')}
          placeholder="08X-XXX-XXXX"
          defaultCountryCode="+66"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {t('customer.field.email')}
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          placeholder={t('customer.edit.emailPlaceholder')}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {t('customer.field.notes')}
        </label>
        <textarea
          value={formData.notes}
          onChange={handleChange('notes')}
          placeholder={t('customer.edit.notesPlaceholder')}
          rows={3}
          className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-1">
            {t('customer.delete.confirm')}
          </p>
          <p className="text-xs text-red-600 mb-3">
            {t('customer.delete.warning')}
          </p>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onShowDeleteConfirm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={onDelete}
            >
              {t('customer.delete.button')}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onShowDeleteConfirm(true)}
          disabled={showDeleteConfirm}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {t('customer.delete.button')}
        </Button>
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isUpdating}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  );
});
