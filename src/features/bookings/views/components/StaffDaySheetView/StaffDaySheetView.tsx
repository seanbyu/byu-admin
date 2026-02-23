'use client';

import { memo, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../../../types';
import { Staff } from '@/features/staff/types';
import { BusinessHours } from '@/types';
import { formatDate } from '@/lib/utils';
import { DAY_KEYS, DAY_SHORT_TRANSLATION_KEYS, generateTimeSlots } from './utils';
import { StaffAccordionItem } from './StaffAccordionItem';

export interface StaffDaySheetViewProps {
  bookings: Booking[];
  staffMembers: Staff[];
  selectedDate: Date;
  selectedStaffId: string;
  onDateChange: (date: Date) => void;
  businessHours: BusinessHours[];
  slotDuration: number;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (staffId: string, time?: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

export const StaffDaySheetView = memo(function StaffDaySheetView({
  bookings,
  staffMembers,
  selectedDate,
  selectedStaffId,
  onDateChange,
  businessHours,
  slotDuration,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
}: StaffDaySheetViewProps) {
  const t = useTranslations();

  const bookingEnabledStaff = useMemo(
    () => staffMembers.filter((s) => s.isBookingEnabled),
    [staffMembers]
  );

  const visibleStaff = useMemo(() => {
    if (!selectedStaffId) return bookingEnabledStaff;
    const matched = bookingEnabledStaff.find((staff) => staff.id === selectedStaffId);
    return matched ? [matched] : bookingEnabledStaff;
  }, [bookingEnabledStaff, selectedStaffId]);

  // 해당 요일의 영업시간 (isOpen 여부 무관하게 조회)
  const todayBusinessHours = useMemo(() => {
    const dayOfWeek = new Date(selectedDate).getDay();
    return businessHours.find((bh) => bh.dayOfWeek === dayOfWeek) ?? null;
  }, [businessHours, selectedDate]);

  const isClosed = todayBusinessHours !== null && !todayBusinessHours.isOpen;

  const timeSlots = useMemo(() => {
    if (!todayBusinessHours) return [];
    return generateTimeSlots(
      todayBusinessHours.openTime,
      todayBusinessHours.closeTime,
      slotDuration
    );
  }, [todayBusinessHours, slotDuration]);

  const bookingsByStaffAndTime = useMemo(() => {
    const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
    const dayBookings = bookings.filter((b) => {
      const bookingDateStr =
        typeof b.date === 'string'
          ? (b.date as string).slice(0, 10)
          : formatDate(b.date as Date, 'yyyy-MM-dd');
      return bookingDateStr === dateStr;
    });

    const grouped: Record<string, Record<string, Booking>> = {};
    bookingEnabledStaff.forEach((staff) => {
      grouped[staff.id] = {};
      dayBookings
        .filter((b) => b.staffId === staff.id)
        .forEach((b) => {
          const slotKey = b.startTime.slice(0, 5);
          grouped[staff.id][slotKey] = b;
        });
    });
    return grouped;
  }, [bookings, bookingEnabledStaff, selectedDate]);

  const getDayShortLabel = useCallback(
    (dayIndex: number) => {
      const dayKey = DAY_KEYS[dayIndex] ?? DAY_KEYS[0];
      return t(DAY_SHORT_TRANSLATION_KEYS[dayKey]);
    },
    [t]
  );

  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    const weekday = getDayShortLabel(d.getDay());
    return t('booking.sheetDateHeader', {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday,
    });
  }, [getDayShortLabel, selectedDate, t]);

  const selectedDateKey = useMemo(
    () => formatDate(selectedDate, 'yyyy-MM-dd'),
    [selectedDate]
  );

  const weekDateButtons = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      const weekday = getDayShortLabel(date.getDay());
      const dayBH = businessHours.find((bh) => bh.dayOfWeek === date.getDay());
      const closed = dayBH?.isOpen === false;

      return {
        key: formatDate(date, 'yyyy-MM-dd'),
        date,
        closed,
        label: t('booking.sheetDateChip', { day: date.getDate(), weekday }),
      };
    });
  }, [businessHours, getDayShortLabel, t]);

  const handlePrevDate = useCallback(() => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  }, [selectedDate, onDateChange]);

  const handleNextDate = useCallback(() => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  }, [selectedDate, onDateChange]);

  if (bookingEnabledStaff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-secondary-400">
        <p>{t('booking.noStaff')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 날짜 네비게이터 */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handlePrevDate}
            aria-label={t('booking.previousDay')}
            className="h-7 w-7 rounded-md border border-secondary-200 text-secondary-500 hover:bg-secondary-50"
          >
            <ChevronLeft size={14} className="mx-auto" />
          </button>
          <span className="text-sm font-medium text-secondary-600">{dateLabel}</span>
          <button
            type="button"
            onClick={handleNextDate}
            aria-label={t('booking.nextDay')}
            className="h-7 w-7 rounded-md border border-secondary-200 text-secondary-500 hover:bg-secondary-50"
          >
            <ChevronRight size={14} className="mx-auto" />
          </button>
          <span className="text-xs text-secondary-400 bg-secondary-100 px-2 py-0.5 rounded-full">
            {visibleStaff.length}
            {t('booking.staffCount')}
          </span>
          {todayBusinessHours && (
            <span className="text-xs text-secondary-400">
              {todayBusinessHours.openTime} – {todayBusinessHours.closeTime}
            </span>
          )}
          {isClosed && (
            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {t('booking.closedDayNotice')}
            </span>
          )}
        </div>

        {/* 주간 날짜 칩 */}
        <div className="w-full overflow-x-auto pb-0.5">
          <div className="mx-auto flex w-max items-center gap-1.5">
            {weekDateButtons.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onDateChange(new Date(item.date))}
                className={`px-2.5 py-1.5 rounded-md border text-xs whitespace-nowrap transition-colors ${
                  item.key === selectedDateKey
                    ? 'bg-primary-500 text-white border-primary-500'
                    : item.closed
                    ? 'bg-secondary-50 text-secondary-400 border-secondary-200 hover:bg-secondary-100'
                    : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
                }`}
              >
                {item.label}
                {item.closed && (
                  <span className="ml-1 text-xs text-error-400">{t('booking.closedDayNotice')}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 영업시간 미설정 안내 */}
      {businessHours.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-700">
          {t('booking.noBusinessHours')}
        </div>
      )}

      {/* 직원별 아코디언 */}
      {visibleStaff.map((staff) => (
        <StaffAccordionItem
          key={staff.id}
          staff={staff}
          timeSlots={timeSlots}
          bookingsByTime={bookingsByStaffAndTime[staff.id] || {}}
          onBookingClick={onBookingClick}
          onAddBooking={onAddBooking}
          onUpdateBooking={onUpdateBooking}
        />
      ))}
    </div>
  );
});

export default StaffDaySheetView;
