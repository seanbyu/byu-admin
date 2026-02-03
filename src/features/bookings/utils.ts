// ============================================
// Shared Utilities for Bookings Feature
// ============================================

import { BusinessHours } from '@/types';

/**
 * Returns today's date in yyyy-MM-dd format
 */
export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns default business hours (Monday off)
 */
export const getDefaultBusinessHours = (): BusinessHours[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '10:00',
    closeTime: '19:00',
    isOpen: i !== 1, // Monday off
  }));
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
