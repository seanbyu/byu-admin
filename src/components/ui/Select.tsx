'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
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
      containerClassName,
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
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            error ? 'input-error' : 'input-base',
            'text-secondary-900 bg-white',
            'disabled:bg-secondary-100 disabled:cursor-not-allowed',
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
