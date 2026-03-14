'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, type, ...props }, ref) => {
    const locale = useLocale();

    // date/time 타입의 경우 locale에 맞는 lang 속성 적용
    const isDateTimeInput =
      type === 'date' || type === 'datetime-local' || type === 'time';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          lang={isDateTimeInput ? locale : undefined}
          className={cn(
            error ? 'input-error' : 'input-base',
            'text-secondary-900 placeholder:text-secondary-400',
            'disabled:bg-secondary-100 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
