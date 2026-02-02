'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  showPlaceholder?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      className,
      placeholder,
      showPlaceholder = true,
      ...props
    },
    ref
  ) => {
    const t = useTranslations('common');
    const placeholderText = placeholder ?? t('select');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            // Base styles
            'w-full pl-3 pr-3 py-2 text-sm',
            'border rounded-lg',
            'text-secondary-900 bg-white',
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
          {...props}
        >
          {showPlaceholder && <option value="">{placeholderText}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
