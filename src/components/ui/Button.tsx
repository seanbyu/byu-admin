import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium',
    'rounded-lg transition-colors duration-normal',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const variants = {
    primary: cn(
      'bg-primary-500 text-white shadow-sm',
      'hover:bg-primary-600 active:bg-primary-700',
      'focus:ring-primary-500'
    ),
    secondary: cn(
      'bg-secondary-100 text-secondary-700',
      'hover:bg-secondary-200 active:bg-secondary-300',
      'focus:ring-secondary-500'
    ),
    outline: cn(
      'border border-secondary-300 text-secondary-700 bg-white',
      'hover:bg-secondary-50 active:bg-secondary-100',
      'focus:ring-primary-500'
    ),
    ghost: cn(
      'text-secondary-600',
      'hover:bg-secondary-100 active:bg-secondary-200',
      'focus:ring-secondary-500'
    ),
    danger: cn(
      'bg-error-500 text-white shadow-sm',
      'hover:bg-error-600 active:bg-error-700',
      'focus:ring-error-500'
    ),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        children
      )}
    </button>
  );
};
