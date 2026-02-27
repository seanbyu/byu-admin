// ============================================
// Shared Utilities for Bookings Feature
// ============================================

import { BusinessHours } from '@/types';

/**
 * Converts a Date to yyyy-MM-dd string using local timezone (avoids UTC shift)
 */
export const toLocalDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's date in yyyy-MM-dd format
 */
export const getTodayString = (): string => toLocalDateStr(new Date());

/**
 * Given a start time "HH:MM" and duration in minutes, returns the end time "HH:MM"
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * Returns default work hours, optionally based on salon business hours.
 * Fallback: Mon off, 10:00-21:00 for other days.
 */
export const getDefaultWorkHours = (salonBusinessHours?: BusinessHours[]): BusinessHours[] => {
  if (salonBusinessHours && salonBusinessHours.length > 0) {
    return salonBusinessHours.map((sh) => ({
      dayOfWeek: sh.dayOfWeek,
      openTime: sh.openTime,
      closeTime: sh.closeTime,
      isOpen: sh.isOpen,
    }));
  }
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '10:00',
    closeTime: '21:00',
    isOpen: i !== 1,
  }));
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
