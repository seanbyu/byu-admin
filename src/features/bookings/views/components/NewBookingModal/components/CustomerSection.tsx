'use client';

import { memo, RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { cn } from '@/lib/utils';
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
          className="text-secondary-900 placeholder:text-secondary-500 focus:ring-[#3B82F6]"
        />
      </div>

      {/* 전화번호 + 내국인/외국인 선택 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-secondary-800">
            {t('customer.phone')}{' '}
            {customerType === 'local' && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTypeChange('local')}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                customerType === 'local'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              )}
            >
              {t('booking.customerType.local')}
            </button>
            <button
              type="button"
              onClick={handleForeignClick}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors',
                customerType === 'foreign'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              )}
            >
              {t('booking.customerType.foreign')}
            </button>
          </div>
        </div>

        {/* 선택된 고객 표시 */}
        {selectedCustomer && (
          <div className="mb-2 p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#1E40AF]" />
              <span className="text-sm font-medium text-[#1E40AF]">
                {selectedCustomer.name}
              </span>
              <span className="text-xs text-[#3B82F6]">{selectedCustomer.phone}</span>
            </div>
            <button
              type="button"
              onClick={onClearCustomer}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8]"
            >
              {t('common.cancel')}
            </button>
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
          />

          {/* 고객 검색 드롭다운 */}
          {customerType === 'local' && showCustomerDropdown && matchingCustomers.length > 0 && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-secondary-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 text-xs text-secondary-600 bg-[#F8FAFC] border-b">
                {t('booking.existingCustomers') || '기존 고객'}
              </div>
              {matchingCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary-50 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-secondary-400" />
                  <div>
                    <div className="text-sm font-medium text-secondary-700">
                      {customer.name}
                    </div>
                    <div className="text-xs text-secondary-500">{customer.phone}</div>
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
