'use client';

import { memo } from 'react';
import { BookingStatus } from '@/types';

export const STATUS_STYLES: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-warning-100 text-warning-700 border-warning-300',
  [BookingStatus.CONFIRMED]: 'bg-info-100 text-info-700 border-info-300',
  [BookingStatus.IN_PROGRESS]: 'bg-primary-100 text-primary-700 border-primary-300',
  [BookingStatus.COMPLETED]: 'bg-success-100 text-success-700 border-success-300',
  [BookingStatus.CANCELLED]: 'bg-error-100 text-error-700 border-error-300',
  [BookingStatus.NO_SHOW]: 'bg-secondary-100 text-secondary-700 border-secondary-300',
};

export const StatusBadge = memo(function StatusBadge({
  status,
  label,
}: {
  status: BookingStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
});
