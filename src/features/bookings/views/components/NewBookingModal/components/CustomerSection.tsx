'use client';

import { memo, RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { cn, formatPhoneDisplay } from '@/lib/utils';
import { User } from 'lucide-react';
import { CustomerType, ExistingCustomer } from '../types';

interface CustomerSectionProps {
  // Form state
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  errors: Record<string, string>;
  // Customer search
  selectedCustomer: ExistingCustomer | null;
  showCustomerDropdown: boolean;
  matchingCustomers: ExistingCustomer[];
  dropdownRef: RefObject<HTMLDivElement | null>;
  // Handlers
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onTypeChange: (type: CustomerType) => void;
  onSelectCustomer: (customer: ExistingCustomer) => void;
  onClearCustomer: () => void;
  onClearErrors: (field: string) => void;
  onPhoneFocus: () => void;
}

function CustomerSectionComponent({
  customerName,
  customerPhone,
  customerType,
  errors,
  selectedCustomer,
  showCustomerDropdown,
  matchingCustomers,
  dropdownRef,
  onNameChange,
  onPhoneChange,
  onTypeChange,
  onSelectCustomer,
  onClearCustomer,
  onClearErrors,
  onPhoneFocus,
}: CustomerSectionProps) {
  const t = useTranslations();

  const handleForeignClick = () => {
    onTypeChange('foreign');
    onPhoneChange('');
    onClearCustomer();
    onClearErrors('customerPhone');
  };

  return (
    <>
      {/* 이름 */}
      <div>
        <Input
          label={t('customer.name')}
          required
          placeholder={t('booking.placeholders.customerName')}
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          error={errors.customerName}
          className="py-1.5 sm:py-2 text-secondary-900 placeholder:text-secondary-500 focus:ring-primary-500"
        />
      </div>

      {/* 전화번호 + 내국인/외국인 선택 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-secondary-800">
            {t('customer.phone')}{' '}
            {customerType === 'local' && <span className="text-error-500">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTypeChange('local')}
              className={cn(
                'px-[var(--btn-px-sm)] py-1 text-xs rounded-full transition-colors',
                customerType === 'local'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              )}
            >
              {t('booking.customerType.local')}
            </button>
            <button
              type="button"
              onClick={handleForeignClick}
              className={cn(
                'px-[var(--btn-px-sm)] py-1 text-xs rounded-full transition-colors',
                customerType === 'foreign'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              )}
            >
              {t('booking.customerType.foreign')}
            </button>
          </div>
        </div>

        {/* 선택된 고객 표시 (기존 고객) */}
        {selectedCustomer && (
          <div className="mb-2 p-2 bg-primary-50 border border-primary-200 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary-700" />
              <span className="text-sm font-medium text-primary-700">
                {selectedCustomer.name}
              </span>
              <span className="text-xs text-primary-500">{formatPhoneDisplay(selectedCustomer.phone)}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-info-100 text-info-700">
                {t('customer.existingCustomer')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearCustomer}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {/* 신규 고객 표시 */}
        {!selectedCustomer && customerPhone.replace(/\D/g, '').length >= 3 && customerType === 'local' && (
          <div className="mb-2 px-2 py-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-100 text-warning-700">
              {t('customer.newCustomer')}
            </span>
          </div>
        )}

        {/* 전화번호 입력 */}
        <div className="relative" ref={dropdownRef}>
          <PhoneInput
            value={customerPhone}
            onChange={onPhoneChange}
            onFocus={onPhoneFocus}
            defaultCountryCode="+66"
            placeholder="012-345-6789"
            error={errors.customerPhone}
            disabled={customerType === 'foreign'}
            compact
          />

          {/* 고객 검색 드롭다운 */}
          {customerType === 'local' && showCustomerDropdown && matchingCustomers.length > 0 && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-primary-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              <div className="px-[var(--input-px)] py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 border-b border-primary-100">
                {t('booking.existingCustomers') || '기존 고객'}
              </div>
              {matchingCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full flex items-center gap-3 px-[var(--input-px)] py-2.5 hover:bg-primary-50 transition-colors text-left border-b border-secondary-100 last:border-b-0"
                >
                  <User className="w-4 h-4 shrink-0 text-primary-400" />
                  <div>
                    <div className="text-sm font-medium text-secondary-900">
                      {customer.name}
                    </div>
                    <div className="text-xs text-secondary-500">{formatPhoneDisplay(customer.phone)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {customerType === 'foreign' && (
          <p className="mt-1 text-xs text-secondary-500">
            {t('booking.customerType.foreignHint')}
          </p>
        )}
      </div>
    </>
  );
}

export const CustomerSection = memo(CustomerSectionComponent);
