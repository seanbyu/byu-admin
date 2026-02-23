'use client';

import { memo } from 'react';
import { BookingStatus } from '@/types';

export const STATUS_STYLES: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-700 border-blue-300',
  [BookingStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-700 border-purple-300',
  [BookingStatus.COMPLETED]: 'bg-green-100 text-green-700 border-green-300',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-300',
  [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-700 border-gray-300',
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
