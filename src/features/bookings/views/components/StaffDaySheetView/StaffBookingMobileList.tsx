'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Booking } from '../../../types';
import { BookingStatus } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { stripCountryCode, PAYMENT_METHOD_KEYS, isKnownPaymentMethod } from './utils';
import { InlineStatusSelect } from './InlineStatusSelect';
import { SalesRegistrationModal } from './SalesRegistrationModal';

export interface StaffBookingMobileListProps {
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (time: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  highlightedBookingId?: string | null;
  serviceCategoryMap?: Record<string, string>;
}

export const StaffBookingMobileList = memo(function StaffBookingMobileList({
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
  highlightedBookingId,
  serviceCategoryMap,
}: StaffBookingMobileListProps) {
  const t = useTranslations();

  const [salesBooking, setSalesBooking] = useState<Booking | null>(null);

  const handleStatusChange = useCallback(
    (id: string, status: BookingStatus) => {
      onUpdateBooking(id, { status });
    },
    [onUpdateBooking]
  );

  const handleOpenSales = useCallback((e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setSalesBooking(booking);
  }, []);

  const sortedBookings = useMemo(
    () =>
      Object.values(bookingsByTime).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ),
    [bookingsByTime]
  );

  const availableSlots = useMemo(
    () => timeSlots.filter((slot) => !bookingsByTime[slot]).slice(0, 8),
    [timeSlots, bookingsByTime]
  );

  return (
    <div className="md:hidden border border-secondary-200 rounded-lg overflow-hidden">
      {sortedBookings.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-secondary-400">
          {t('booking.noBookings')}
        </div>
      ) : (
        <div className="divide-y divide-secondary-100">
          {sortedBookings.map((booking) => (
            <div
              key={booking.id}
              data-booking-id={booking.id}
              role="button"
              tabIndex={0}
              onClick={() => onBookingClick(booking)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onBookingClick(booking);
              }}
              className={cn(
                'w-full text-left px-3 py-3 bg-white hover:bg-secondary-50 transition-colors',
                highlightedBookingId === booking.id && 'booking-highlight'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-900 truncate">
                    {booking.startTime.slice(0, 5)} · {booking.serviceName?.includes(', ') ? booking.serviceName : (serviceCategoryMap?.[booking.serviceId] || booking.serviceName)}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary-600 truncate">
                    {booking.customerName}
                    {booking.customerPhone
                      ? ` · ${stripCountryCode(booking.customerPhone)}`
                      : ''}
                  </p>
                </div>
                <InlineStatusSelect
                  bookingId={booking.id}
                  status={booking.status}
                  onUpdate={handleStatusChange}
                />
              </div>

              {booking.notes && (
                <p className="mt-1.5 text-xs text-secondary-500 truncate">
                  {booking.notes}
                </p>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-secondary-400">{t('booking.price')}</span>
                  <div
                    className="text-secondary-800 font-medium cursor-pointer hover:text-primary-600"
                    onClick={(e) => handleOpenSales(e, booking)}
                  >
                    {booking.price > 0 ? formatPrice(booking.price) : t('booking.salesModal.registerSales')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-secondary-400">{t('booking.paymentMethod')}</span>
                  <div className="text-secondary-700 font-medium truncate">
                    {booking.paymentMethod
                      ? isKnownPaymentMethod(booking.paymentMethod)
                        ? t(PAYMENT_METHOD_KEYS[booking.paymentMethod])
                        : booking.paymentMethod
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableSlots.length > 0 && (
        <div className="border-t border-secondary-100 bg-secondary-50 px-3 py-2">
          <p className="text-xs font-medium text-secondary-500 mb-2">
            {t('booking.addBooking')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onAddBooking(slot)}
                className="px-2 py-1 rounded-md border border-secondary-200 bg-white text-xs text-secondary-700 hover:bg-primary-50 hover:border-primary-300"
              >
                + {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      <SalesRegistrationModal
        isOpen={!!salesBooking}
        onClose={() => setSalesBooking(null)}
        booking={salesBooking}
        onSave={onUpdateBooking}
      />
    </div>
  );
});
