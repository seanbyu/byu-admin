'use client';

import { memo, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Booking } from '../../../types';
import { BookingStatus } from '@/types';
import { stripCountryCode, PAYMENT_METHOD_KEYS, isKnownPaymentMethod } from './utils';
import { InlineStatusSelect } from './InlineStatusSelect';
import { InlinePriceCell } from './InlinePriceCell';

export interface StaffBookingMobileListProps {
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (time: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

export const StaffBookingMobileList = memo(function StaffBookingMobileList({
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
}: StaffBookingMobileListProps) {
  const t = useTranslations();

  const handleStatusChange = useCallback(
    (id: string, status: BookingStatus) => {
      onUpdateBooking(id, { status });
    },
    [onUpdateBooking]
  );

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
              role="button"
              tabIndex={0}
              onClick={() => onBookingClick(booking)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onBookingClick(booking);
              }}
              className="w-full text-left px-3 py-3 bg-white hover:bg-secondary-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-900 truncate">
                    {booking.startTime.slice(0, 5)} · {booking.serviceName}
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
                  <div className="text-secondary-800 font-medium">
                    <InlinePriceCell
                      bookingId={booking.id}
                      price={booking.price}
                      onUpdate={(id, price) => onUpdateBooking(id, { price })}
                    />
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
    </div>
  );
});
