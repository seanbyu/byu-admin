'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Booking } from '../../../types';
import { BookingStatus } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { stripCountryCode, PAYMENT_METHOD_KEYS, isKnownPaymentMethod } from './utils';
import { InlineStatusSelect } from './InlineStatusSelect';
import { SalesRegistrationModal } from '../SalesRegistrationModal';
import type { BookingNotificationStatus } from '@/app/api/salons/[salonId]/bookings/notification-status/route';

export interface StaffBookingMobileListProps {
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (time: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  highlightedBookingId?: string | null;
  serviceCategoryMap?: Record<string, string>;
  notificationStatuses?: Record<string, BookingNotificationStatus>;
  slotDuration?: number;
}

function getStatusStyle(status: BookingStatus): string {
  if (status === BookingStatus.PENDING)     return 'bg-amber-50 border-amber-300 text-amber-900';
  if (status === BookingStatus.CONFIRMED)   return 'bg-blue-50 border-blue-300 text-blue-900';
  if (status === BookingStatus.IN_PROGRESS) return 'bg-purple-50 border-purple-300 text-purple-900';
  if (status === BookingStatus.COMPLETED)   return 'bg-secondary-100 border-secondary-300 text-secondary-500';
  if (status === BookingStatus.CANCELLED)   return 'bg-secondary-50 border-secondary-200 text-secondary-400';
  if (status === BookingStatus.NO_SHOW)     return 'bg-red-50 border-red-300 text-red-900';
  return 'bg-white border-secondary-200';
}

const SLOT_H = 56;

interface BookingCardProps {
  booking: Booking;
  rowH: number;
  highlighted: boolean;
  serviceCategoryMap?: Record<string, string>;
  onBookingClick: (b: Booking) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onOpenSales: (booking: Booking) => void;
  t: ReturnType<typeof useTranslations>;
}

function BookingCard({ booking, rowH, highlighted, serviceCategoryMap, onBookingClick, onUpdateBooking, onOpenSales, t }: BookingCardProps) {
  const isCancelled = booking.status === BookingStatus.CANCELLED;
  const isSalesRegistered = !!(booking.bookingMeta && booking.bookingMeta.sales_registered);

  const serviceName = (serviceCategoryMap && booking.serviceId && serviceCategoryMap[booking.serviceId])
    ? serviceCategoryMap[booking.serviceId]
    : (booking.serviceName || '');

  const customerInfo = booking.customerPhone
    ? booking.customerName + ' · ' + stripCountryCode(booking.customerPhone)
    : booking.customerName;

  const price = booking.price || 0;
  const priceText = price > 0 ? formatPrice(price) : '';
  const addSalesText = t('booking.salesModal.registerSales');

  const paymentText = booking.paymentMethod
    ? (isKnownPaymentMethod(booking.paymentMethod) ? t(PAYMENT_METHOD_KEYS[booking.paymentMethod]) : booking.paymentMethod)
    : '';

  const handleClick = () => {
    if (isSalesRegistered) {
      onOpenSales(booking);
    } else {
      onBookingClick(booking);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    onUpdateBooking(id, { status });
  };

  const handlePriceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenSales(booking);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const cardClass = cn(
    'w-full rounded-lg border px-3 py-2 text-left transition-opacity active:opacity-70',
    getStatusStyle(booking.status),
    highlighted && 'ring-2 ring-primary-400',
    isCancelled && 'opacity-50'
  );

  const titleClass = cn(
    'text-sm font-semibold leading-tight truncate',
    isCancelled && 'line-through'
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cardClass}
      style={{ minHeight: rowH - 8 }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className={titleClass}>{serviceName}</p>
          <p className="text-xs mt-0.5 truncate opacity-75">{customerInfo}</p>
          {!isCancelled && (
            <p className="text-xs mt-1 font-medium cursor-pointer hover:underline" onClick={handlePriceClick}>
              {priceText ? priceText : <span className="opacity-50">{addSalesText}</span>}
            </p>
          )}
        </div>
        <div onClick={handleStatusClick}>
          <InlineStatusSelect
            bookingId={booking.id}
            status={booking.status}
            onUpdate={handleStatusChange}
            disabled={isSalesRegistered}
          />
        </div>
      </div>
      {booking.notes && (
        <p className="mt-1 text-[11px] opacity-60 truncate">{booking.notes}</p>
      )}
      {paymentText && !isCancelled && (
        <p className="mt-0.5 text-[11px] opacity-50">{paymentText}</p>
      )}
    </div>
  );
}

export function StaffBookingMobileList({
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
  highlightedBookingId,
  serviceCategoryMap,
  slotDuration = 30,
}: StaffBookingMobileListProps) {
  const t = useTranslations();
  const [salesBooking, setSalesBooking] = useState<Booking | null>(null);

  const handleOpenSales = useCallback((booking: Booking) => {
    setSalesBooking(booking);
  }, []);

  const getSlotSpan = useCallback((booking: Booking): number => {
    const endTime = booking.endTime as string | undefined;
    if (!endTime) return 1;
    const startParts = booking.startTime.split(':');
    const endParts = endTime.split(':');
    const sh = parseInt(startParts[0] || '0', 10);
    const sm = parseInt(startParts[1] || '0', 10);
    const eh = parseInt(endParts[0] || '0', 10);
    const em = parseInt(endParts[1] || '0', 10);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(1, Math.round(mins / slotDuration));
  }, [slotDuration]);

  // 모바일은 항상 30분 단위로 표시 + 정규 슬롯 밖 예약도 포함
  const mergedSlots = useMemo(() => {
    if (timeSlots.length === 0) return [];
    // 첫/마지막 슬롯 기준으로 30분 단위 슬롯 생성
    const first = timeSlots[0];
    const last = timeSlots[timeSlots.length - 1];
    if (!first || !last) return timeSlots;
    const [fh, fm] = first.split(':').map(Number);
    const [lh, lm] = last.split(':').map(Number);
    const startMin = (fh || 0) * 60 + (fm || 0);
    const endMin = (lh || 0) * 60 + (lm || 0);
    const slots: string[] = [];
    for (let m = startMin; m <= endMin; m += 30) {
      const h = Math.floor(m / 60).toString().padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      slots.push(h + ':' + min);
    }
    // 정규 슬롯 밖 예약도 추가
    const offTimes = Object.keys(bookingsByTime).filter((t) => !slots.includes(t));
    return [...slots, ...offTimes].sort();
  }, [timeSlots, bookingsByTime]);

  const coveredSlots = useMemo(() => {
    const covered = new Set<string>();
    mergedSlots.forEach((slot) => {
      const booking = bookingsByTime[slot];
      if (!booking) return;
      const span = getSlotSpan(booking);
      for (let i = 1; i < span; i++) {
        const idx = mergedSlots.indexOf(slot) + i;
        const nextSlot = mergedSlots[idx];
        if (nextSlot) covered.add(nextSlot);
      }
    });
    return covered;
  }, [mergedSlots, bookingsByTime, getSlotSpan]);

  if (timeSlots.length === 0) {
    return (
      <div className="md:hidden py-8 text-center text-sm text-secondary-400">
        {t('booking.noBookings')}
      </div>
    );
  }

  return (
    <div className="md:hidden">
      <div className="relative divide-y divide-secondary-100">
        {mergedSlots.map((slot) => {
          if (coveredSlots.has(slot)) return null;

          const booking = bookingsByTime[slot];
          const span = booking ? getSlotSpan(booking) : 1;
          const rowH = SLOT_H * span;
          const highlighted = highlightedBookingId === (booking ? booking.id : '');

          return (
            <div key={slot} className="flex items-stretch" style={{ minHeight: rowH }}>
              <div className="w-12 flex-shrink-0 flex items-start justify-end pr-2 pt-3">
                <span className="text-[11px] font-medium text-secondary-400">{slot}</span>
              </div>
              <div className="flex-1 py-1 pr-1">
                {booking ? (
                  <BookingCard
                    booking={booking}
                    rowH={rowH}
                    highlighted={highlighted}
                    serviceCategoryMap={serviceCategoryMap}
                    onBookingClick={onBookingClick}
                    onUpdateBooking={onUpdateBooking}
                    onOpenSales={handleOpenSales}
                    t={t}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddBooking(slot)}
                    className="w-full rounded-lg border border-dashed border-secondary-200 flex items-center justify-center gap-1 text-secondary-300 hover:border-primary-300 hover:text-primary-400 transition-colors"
                    style={{ minHeight: SLOT_H - 8 }}
                  >
                    <Plus size={13} />
                    <span className="text-xs">{slot}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SalesRegistrationModal
        isOpen={!!salesBooking}
        onClose={() => setSalesBooking(null)}
        booking={salesBooking}
        onSave={onUpdateBooking}
      />
    </div>
  );
}
