'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            {label}
            {props.required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm',
            'border rounded-lg',
            'text-secondary-900 placeholder:text-secondary-400',
            'transition-colors duration-fast',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:bg-secondary-100 disabled:cursor-not-allowed',
            error
              ? 'border-error-500 focus:ring-error-500'
              : 'border-secondary-300 focus:ring-primary-500',
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

Textarea.displayName = 'Textarea';
