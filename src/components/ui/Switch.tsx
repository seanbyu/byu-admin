'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onCheckedChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none',
          checked ? 'bg-primary-500' : 'bg-secondary-200',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white border border-secondary-300 shadow-sm transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
