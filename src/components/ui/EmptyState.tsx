import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  className?: string;
}

const paddingMap = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
};

export function EmptyState({
  message,
  description,
  icon,
  action,
  size = 'md',
  bordered = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        paddingMap[size],
        bordered && 'rounded-lg border border-dashed border-secondary-200 bg-white',
        className
      )}
    >
      {icon && (
        <div className="text-secondary-300 mb-3">{icon}</div>
      )}
      <p className="text-sm text-secondary-500">{message}</p>
      {description && (
        <p className="text-xs text-secondary-400 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
