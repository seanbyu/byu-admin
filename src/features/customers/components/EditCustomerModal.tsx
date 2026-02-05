'use client';

import { memo, useCallback, useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '../hooks/useCustomers';
import type { CustomerListItem, UpdateCustomerDto } from '../types';

// ============================================
// EditCustomerModal Component
// ============================================

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: CustomerListItem | null;
  onClose: () => void;
}

export const EditCustomerModal = memo(function EditCustomerModal({
  isOpen,
  customer,
  onClose,
}: EditCustomerModalProps) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const { updateCustomer, isUpdating } = useCustomers({ salon_id: salonId });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    customer_type: 'local' as 'local' | 'foreign',
  });

  // Initialize form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        notes: customer.notes || '',
        customer_type: customer.customer_type || 'local',
      });
    }
  }, [customer]);

  const handleChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }, []);

  const handleCustomerTypeChange = useCallback((type: 'local' | 'foreign') => {
    setFormData((prev) => ({ ...prev, customer_type: type }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!customer) return;

      try {
        const updates: UpdateCustomerDto = {
          name: formData.name,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          notes: formData.notes || undefined,
          customer_type: formData.customer_type,
        };

        await updateCustomer({
          customerId: customer.id,
          updates,
        });

        onClose();
      } catch (error) {
        console.error('Failed to update customer:', error);
      }
    },
    [customer, formData, updateCustomer, onClose]
  );

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('customer.edit.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.phone')}
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder={t('customer.edit.phonePlaceholder')}
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
            rows={4}
            className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isUpdating}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
