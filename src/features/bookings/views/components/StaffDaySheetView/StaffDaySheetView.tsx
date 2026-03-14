'use client';

import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Booking } from '../../../types';
import { Staff } from '@/features/staff/types';
import { BusinessHours } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useServiceCategoryMap } from '../../../hooks/useMenuMaps';
import { DAY_KEYS, DAY_SHORT_TRANSLATION_KEYS, generateTimeSlots } from './utils';
import { StaffAccordionItem } from './StaffAccordionItem';
import { CalendarDropdown } from './CalendarDropdown';
import type { BookingNotificationStatus } from '@/app/api/salons/[salonId]/bookings/notification-status/route';

export interface StaffDaySheetViewProps {
  bookings: Booking[];
  staffMembers: Staff[];
  selectedDate: Date;
  selectedStaffId: string;
  selectedStaffIds?: string[];
  onDateChange: (date: Date) => void;
  businessHours: BusinessHours[];
  slotDuration: number;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (staffId: string, time?: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  highlightedBookingId?: string | null;
  notificationStatuses?: Record<string, BookingNotificationStatus>;
}

export const StaffDaySheetView = memo(function StaffDaySheetView({
  bookings,
  staffMembers,
  selectedDate,
  selectedStaffId,
  selectedStaffIds = [],
  onDateChange,
  businessHours,
  slotDuration,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
  highlightedBookingId,
  notificationStatuses,
}: StaffDaySheetViewProps) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // serviceId → categoryName 매핑 (테이블에서 카테고리명으로 표시)
  const serviceCategoryMap = useServiceCategoryMap(salonId);

  const bookingEnabledStaff = useMemo(
    () => staffMembers.filter((s) => s.isBookingEnabled),
    [staffMembers]
  );

  const visibleStaff = useMemo(() => {
    // 멀티 선택 필터 우선 적용
    if (selectedStaffIds.length > 0) {
      const idSet = new Set(selectedStaffIds);
      return bookingEnabledStaff.filter((s) => idSet.has(s.id));
    }
    // 단일 선택 (새 예약 pre-fill 용도)
    if (selectedStaffId) {
      const matched = bookingEnabledStaff.find((s) => s.id === selectedStaffId);
      return matched ? [matched] : bookingEnabledStaff;
    }
    return bookingEnabledStaff;
  }, [bookingEnabledStaff, selectedStaffId, selectedStaffIds]);

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

  // 이번 달 전체 날짜 (1일 ~ 말일)
  const monthDateButtons = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: lastDay }, (_, i) => {
      const date = new Date(year, month, i + 1);
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
  }, [businessHours, getDayShortLabel, selectedDate, t]);

  // 선택 날짜 변경 시 해당 칩으로 자동 스크롤
  const dateStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dateStripRef.current) return;
    const el = dateStripRef.current.querySelector<HTMLElement>(`[data-date-key="${selectedDateKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDateKey]);

  const handlePrevDate = useCallback(() => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    onDateChange(prev);
  }, [selectedDate, onDateChange]);

  const handleNextDate = useCallback(() => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    onDateChange(next);
  }, [selectedDate, onDateChange]);

  if (bookingEnabledStaff.length === 0) {
    return <EmptyState message={t('booking.noStaff')} size="lg" />;
  }

  return (
    <div className="space-y-3">
      {/* 날짜 네비게이터 */}
      <div className="space-y-2">
        {/* 날짜 컨트롤 행 */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevDate}
              aria-label={t('booking.previousDay')}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-secondary-200 text-secondary-500 hover:bg-secondary-50"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary-700">{dateLabel}</span>
              <CalendarDropdown
                selectedDate={selectedDate}
                onDateChange={onDateChange}
                businessHours={businessHours}
              />
            </div>
            <button
              type="button"
              onClick={handleNextDate}
              aria-label={t('booking.nextDay')}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-secondary-200 text-secondary-500 hover:bg-secondary-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary-400">
            <span>{visibleStaff.length}{t('booking.staffCount')}</span>
            {todayBusinessHours && (
              <span>{todayBusinessHours.openTime}–{todayBusinessHours.closeTime}</span>
            )}
            {isClosed && (
              <span className="font-medium text-error-500 bg-error-50 px-1.5 py-0.5 rounded">
                {t('booking.closedDayNotice')}
              </span>
            )}
          </div>
        </div>

        {/* 월간 날짜 칩 (스와이프 캐로셀) */}
        <div ref={dateStripRef} className="flex gap-1 overflow-x-scroll scrollbar-hide py-0.5">
          {monthDateButtons.map((item) => (
            <button
              key={item.key}
              data-date-key={item.key}
              type="button"
              onClick={() => onDateChange(new Date(item.date))}
              className={`flex-none w-[52px] py-1.5 rounded-md border text-xs whitespace-nowrap transition-colors text-center ${
                item.key === selectedDateKey
                  ? 'bg-primary-500 text-white border-primary-500'
                  : item.closed
                  ? 'bg-secondary-50 text-secondary-300 border-secondary-200 hover:bg-secondary-100'
                  : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              {item.label}
              {item.closed && (
                <span className="block text-[10px] text-error-400 leading-none mt-0.5">
                  {t('booking.closedDayNotice')}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 영업시간 미설정 안내 */}
      {businessHours.length === 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-center text-sm text-warning-700">
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
          highlightedBookingId={highlightedBookingId}
          serviceCategoryMap={serviceCategoryMap}
          notificationStatuses={notificationStatuses}
        />
      ))}
    </div>
  );
});

export default StaffDaySheetView;
