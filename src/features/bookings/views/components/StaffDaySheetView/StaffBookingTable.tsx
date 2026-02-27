'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Booking } from '../../../types';
import { BookingStatus } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import {
  addMinutes,
  stripCountryCode,
  PAYMENT_METHOD_KEYS,
  isKnownPaymentMethod,
} from './utils';
import { InlineStatusSelect } from './InlineStatusSelect';
import { SalesRegistrationModal } from './SalesRegistrationModal';
import { StaffBookingMobileList } from './StaffBookingMobileList';

export interface StaffBookingTableProps {
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (time: string) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  highlightedBookingId?: string | null;
  serviceCategoryMap?: Record<string, string>;
}

export const StaffBookingTable = memo(function StaffBookingTable({
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
  highlightedBookingId,
  serviceCategoryMap,
}: StaffBookingTableProps) {
  const t = useTranslations();

  const handleStatusChange = useCallback(
    (id: string, status: BookingStatus) => {
      onUpdateBooking(id, { status });
    },
    [onUpdateBooking]
  );
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [salesBooking, setSalesBooking] = useState<Booking | null>(null);

  const handleOpenSales = useCallback((e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setSalesBooking(booking);
  }, []);

  const totalPrice = useMemo(
    () => Object.values(bookingsByTime).reduce((sum, b) => sum + (b.price || 0), 0),
    [bookingsByTime]
  );

  const totalProductAmount = useMemo(
    () => Object.values(bookingsByTime).reduce((sum, b) => sum + (b.productAmount || 0), 0),
    [bookingsByTime]
  );

  const bookingCount = Object.keys(bookingsByTime).length;

  // 정규 슬롯 + 정규 슬롯 밖의 예약 시간 병합 (정렬)
  const mergedSlots = useMemo(() => {
    const offIntervalTimes = Object.keys(bookingsByTime).filter(
      (time) => !timeSlots.includes(time)
    );
    return [...timeSlots, ...offIntervalTimes].sort();
  }, [timeSlots, bookingsByTime]);

  if (timeSlots.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-secondary-400">
        {t('booking.noBusinessHours')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <StaffBookingMobileList
        timeSlots={timeSlots}
        bookingsByTime={bookingsByTime}
        onBookingClick={onBookingClick}
        onAddBooking={onAddBooking}
        onUpdateBooking={onUpdateBooking}
        highlightedBookingId={highlightedBookingId}
        serviceCategoryMap={serviceCategoryMap}
      />

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs lg:text-sm border-collapse min-w-[820px] lg:min-w-[900px]">
          <thead>
            <tr className="bg-secondary-50">
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600 w-20">
                {t('booking.time')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600 w-36">
                {t('booking.service')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600 w-28">
                {t('booking.customer')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600 w-32">
                {t('booking.phone')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600">
                {t('booking.notes')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600 w-24">
                {t('booking.status')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-right font-medium text-secondary-600 w-28">
                {t('booking.price')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-center font-medium text-secondary-600 w-32">
                {t('booking.paymentMethod')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-right font-medium text-secondary-600 w-28">
                {t('booking.productAmount')}
              </th>
              <th className="border border-secondary-200 px-2 lg:px-3 py-2 text-left font-medium text-secondary-600 w-28">
                {t('booking.product')}
              </th>
            </tr>
          </thead>

          {/* 슬롯별 tbody — 메인 행 + 서브슬롯 행을 같은 그룹으로 묶어 깜빡임 방지 */}
          {mergedSlots.map((slot) => {
            const booking = bookingsByTime[slot];
            const subSlotTime = addMinutes(slot, 30);
            const hasSubSlot = !mergedSlots.includes(subSlotTime);
            const isHovered = hoveredSlot === slot;

            return (
              <tbody
                key={slot}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
              >
                {booking ? (
                  <tr
                    data-booking-id={booking.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      booking.bookingMeta?.sales_registered
                        ? 'bg-secondary-100 hover:bg-secondary-200'
                        : 'hover:bg-primary-50',
                      highlightedBookingId === booking.id && 'booking-highlight'
                    )}
                    onClick={() =>
                      booking.bookingMeta?.sales_registered
                        ? setSalesBooking(booking)
                        : onBookingClick(booking)
                    }
                  >
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-700 font-medium">
                      {slot}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-900">
                      {booking.serviceName?.includes(', ') ? booking.serviceName : (serviceCategoryMap?.[booking.serviceId] || booking.serviceName)}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-700">
                      {booking.customerName}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-500 text-xs">
                      {booking.customerPhone ? stripCountryCode(booking.customerPhone) : '—'}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-500 text-xs max-w-[180px]">
                      <span className="truncate block">{booking.notes || '—'}</span>
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2">
                      <InlineStatusSelect
                        bookingId={booking.id}
                        status={booking.status}
                        onUpdate={handleStatusChange}
                        disabled={!!booking.bookingMeta?.sales_registered}
                      />
                    </td>
                    <td
                      className="border border-secondary-200 px-2 lg:px-3 py-2 text-right text-secondary-700 group/price relative cursor-pointer hover:bg-primary-50"
                      onClick={(e) => handleOpenSales(e, booking)}
                    >
                      <span className="group-hover/price:hidden">
                        {booking.price > 0 ? formatPrice(booking.price) : '—'}
                      </span>
                      <span className="hidden group-hover/price:inline text-primary-600 text-xs font-medium">
                        {t('booking.salesModal.registerSales')}
                      </span>
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-center text-secondary-600 text-xs">
                      {booking.paymentMethod
                        ? isKnownPaymentMethod(booking.paymentMethod)
                          ? t(PAYMENT_METHOD_KEYS[booking.paymentMethod])
                          : booking.paymentMethod
                        : '—'}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-right text-secondary-700">
                      {booking.productAmount > 0 ? formatPrice(booking.productAmount) : '—'}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-600 text-xs">
                      {booking.productName || '—'}
                    </td>
                  </tr>
                ) : (
                  <tr
                    className="transition-colors cursor-pointer hover:bg-primary-50"
                    onClick={() => onAddBooking(slot)}
                  >
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-400 font-medium h-9">
                      {slot}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-secondary-300 text-xs select-none">
                      {isHovered ? `+ ${t('booking.addBooking')}` : ''}
                    </td>
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                    <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                  </tr>
                )}

                {/* 30분 서브슬롯 행 — 호버 시에만 표시, 같은 tbody 안이라 깜빡임 없음 */}
                {hasSubSlot && isHovered && (
                  <tr
                    className="cursor-pointer bg-secondary-50/80 hover:bg-primary-50 transition-colors"
                    onClick={() => onAddBooking(subSlotTime)}
                  >
                    <td className="border-x border-b border-secondary-200 px-2 lg:px-3 py-1.5 text-secondary-400 text-xs font-medium">
                      <span className="text-secondary-300 mr-1">└</span>
                      {subSlotTime}
                    </td>
                    <td
                      className="border-x border-b border-secondary-200 px-2 lg:px-3 py-1.5 text-secondary-300 text-xs"
                      colSpan={9}
                    >
                      + {t('booking.addBooking')}
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}

          {/* 합계 행 */}
          {bookingCount > 0 && (
            <tbody>
              <tr className="bg-secondary-50 font-semibold">
                <td
                  colSpan={6}
                  className="border border-secondary-200 px-2 lg:px-3 py-2 text-center text-sm text-secondary-600"
                >
                  {t('booking.total')} ({bookingCount}{t('booking.bookingCount')})
                </td>
                <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-right text-sm font-bold text-secondary-900">
                  {formatPrice(totalPrice)}
                </td>
                <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
                <td className="border border-secondary-200 px-2 lg:px-3 py-2 text-right text-sm font-bold text-secondary-900">
                  {totalProductAmount > 0 ? formatPrice(totalProductAmount) : '—'}
                </td>
                <td className="border border-secondary-200 px-2 lg:px-3 py-2" />
              </tr>
            </tbody>
          )}
        </table>
      </div>

      <SalesRegistrationModal
        isOpen={!!salesBooking}
        onClose={() => setSalesBooking(null)}
        booking={salesBooking}
        onSave={onUpdateBooking}
      />
    </div>
  );
});
