'use client';

import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { useLocale, useTranslations } from 'next-intl';
import { ko, enUS, th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
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
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
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
            // Base styles
            'w-full px-3 py-2 pr-9 text-sm',
            'border rounded-lg',
            'text-secondary-900 placeholder:text-secondary-400',
            'transition-colors duration-fast',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:border-transparent',
            // Disabled styles
            'disabled:bg-secondary-100 disabled:cursor-not-allowed',
            // Error or default border
            error
              ? 'border-error-500 focus:ring-error-500'
              : 'border-secondary-300 focus:ring-primary-500',
            className
          )}
          wrapperClassName="w-full"
          showPopperArrow={false}
          popperPlacement="bottom-start"
        />
        <Calendar
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500"
        />
      </div>
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  );
}
