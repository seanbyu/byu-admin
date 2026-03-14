import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  headerAction,
  hover = false,
  padding = 'md',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-[var(--card-padding-sm)]',
    md: 'p-[var(--card-padding-md)]',
    lg: 'p-[var(--card-padding-lg)]',
  };

  return (
    <div
      className={cn(
        'bg-white shadow-sm border border-secondary-200 rounded-[var(--card-radius)]',
        hover && 'transition-shadow duration-normal hover:shadow-md',
        className
      )}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-secondary-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-secondary-600 mt-1">{subtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};
