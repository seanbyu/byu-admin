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
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyleMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
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
