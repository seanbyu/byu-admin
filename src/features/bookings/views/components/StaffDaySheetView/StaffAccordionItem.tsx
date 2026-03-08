'use client';

import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Booking } from '../../../types';
import { Staff } from '@/features/staff/types';
import { formatPrice } from '@/lib/utils';
import { StaffBookingTable } from './StaffBookingTable';
import type { BookingNotificationStatus } from '@/app/api/salons/[salonId]/bookings/notification-status/route';

export interface StaffAccordionItemProps {
  staff: Staff;
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (staffId: string, time?: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  highlightedBookingId?: string | null;
  serviceCategoryMap?: Record<string, string>;
  notificationStatuses?: Record<string, BookingNotificationStatus>;
}

export const StaffAccordionItem = memo(function StaffAccordionItem({
  staff,
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
  highlightedBookingId,
  serviceCategoryMap,
  notificationStatuses,
}: StaffAccordionItemProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(true);

  // 하이라이트된 예약이 이 스태프에 속하면 아코디언 자동 펼침
  const hasHighlightedBooking = highlightedBookingId
    ? Object.values(bookingsByTime).some((b) => b.id === highlightedBookingId)
    : false;

  useEffect(() => {
    if (hasHighlightedBooking && !isOpen) {
      setIsOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHighlightedBooking]);

  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddBooking(staff.id);
    },
    [staff.id, onAddBooking]
  );

  const handleAddAtTime = useCallback(
    (time: string) => {
      onAddBooking(staff.id, time);
    },
    [staff.id, onAddBooking]
  );

  const bookingCount = Object.keys(bookingsByTime).length;

  const totalPrice = useMemo(
    () => Object.values(bookingsByTime).reduce((sum, b) => sum + (b.price || 0), 0),
    [bookingsByTime]
  );

  return (
    <div className="border border-secondary-200 rounded-lg overflow-hidden bg-white">
      {/* 아코디언 헤더 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-white hover:bg-secondary-50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {isOpen ? (
            <ChevronDown size={18} className="text-secondary-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-secondary-400 flex-shrink-0" />
          )}
          <span className="font-semibold text-sm md:text-base text-secondary-900 truncate">
            {staff.name}
          </span>
          <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">
            {bookingCount}
            {t('booking.bookingCount')}
          </span>
          {bookingCount > 0 && (
            <span className="hidden sm:inline text-xs text-secondary-400">
              {t('booking.total')}: {formatPrice(totalPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-primary-200"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">{t('booking.new')}</span>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-secondary-200">
          <StaffBookingTable
            timeSlots={timeSlots}
            bookingsByTime={bookingsByTime}
            onBookingClick={onBookingClick}
            onAddBooking={handleAddAtTime}
            onUpdateBooking={onUpdateBooking}
            highlightedBookingId={highlightedBookingId}
            serviceCategoryMap={serviceCategoryMap}
            notificationStatuses={notificationStatuses}
          />
        </div>
      )}
    </div>
  );
});
