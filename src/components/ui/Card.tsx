import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  headerAction,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-secondary-200',
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
      <div className="p-6">{children}</div>
    </div>
  );
};
