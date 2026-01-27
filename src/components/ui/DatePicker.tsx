'use client';

import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { useLocale, useTranslations } from 'next-intl';
import { ko, enUS, th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

// 로케일 등록
registerLocale('ko', ko);
registerLocale('en', enUS);
registerLocale('th', th);

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  error,
  placeholder,
  className,
  disabled,
  required,
  minDate,
  maxDate,
}: DatePickerProps) {
  const locale = useLocale();
  const t = useTranslations();

  // string을 Date로 변환
  const selectedDate = value ? new Date(value) : null;

  // Date를 yyyy-MM-dd string으로 변환
  const handleChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        locale={locale}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder || t('common.select')}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-secondary-900 placeholder-secondary-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-secondary-100 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:ring-red-500' : 'border-secondary-300',
          className
        )}
        wrapperClassName="w-full"
        showPopperArrow={false}
        popperPlacement="bottom-start"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
