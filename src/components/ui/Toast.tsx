'use client';

import { memo, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styleMap = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-error-50 border-error-200 text-error-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
};

const iconStyleMap = {
  success: 'text-success-500',
  error: 'text-error-500',
  info: 'text-primary-500',
};

export const Toast = memo(function Toast({
  id,
  message,
  type = 'success',
  duration = 3000,
  onClose,
}: ToastProps) {
  const Icon = iconMap[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
        'toast-enter',
        styleMap[type]
      )}
      role="alert"
    >
      <Icon size={20} className={iconStyleMap[type]} />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
});
