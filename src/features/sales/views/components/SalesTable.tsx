'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Booking } from '@/features/bookings/types';

interface Props {
  bookings: Booking[];
  onRowClick?: (booking: Booking) => void;
}

const PAYMENT_BADGE: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  CARD: 'info',
  CASH: 'success',
  TRANSFER: 'warning',
};

const PAYMENT_I18N_KEYS: Record<string, string> = {
  CARD: 'booking.paymentMethodCard',
  CASH: 'booking.paymentMethodCash',
  TRANSFER: 'booking.paymentMethodTransfer',
};

export function SalesTable({ bookings, onRowClick }: Props) {
  const t = useTranslations();

  return (
    <Card title={t('sales.salesList')} padding="sm">
      {bookings.length === 0 ? (
        <p className="text-sm text-secondary-400 py-6 text-center">{t('sales.noData')}</p>
      ) : (
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-secondary-50">
                <th className="border border-secondary-200 px-3 py-2 text-left text-xs font-medium text-secondary-500">{t('booking.date')}</th>
                <th className="border border-secondary-200 px-3 py-2 text-left text-xs font-medium text-secondary-500">{t('booking.time')}</th>
                <th className="border border-secondary-200 px-3 py-2 text-left text-xs font-medium text-secondary-500">{t('booking.customer')}</th>
                <th className="border border-secondary-200 px-3 py-2 text-left text-xs font-medium text-secondary-500">{t('booking.service')}</th>
                <th className="border border-secondary-200 px-3 py-2 text-left text-xs font-medium text-secondary-500">{t('booking.staff')}</th>
                <th className="border border-secondary-200 px-3 py-2 text-right text-xs font-medium text-secondary-500">{t('booking.price')}</th>
                <th className="border border-secondary-200 px-3 py-2 text-center text-xs font-medium text-secondary-500">{t('booking.paymentMethod')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const date = typeof b.date === 'string' ? b.date : b.date.toLocaleDateString();
                const payBadge = PAYMENT_BADGE[b.paymentMethod ?? ''] ?? 'default';
                const payLabel = b.paymentMethod
                  ? t(PAYMENT_I18N_KEYS[b.paymentMethod] ?? b.paymentMethod)
                  : null;
                return (
                  <tr
                    key={b.id}
                    onClick={() => onRowClick?.(b)}
                    className={`hover:bg-primary-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    <td className="border border-secondary-200 px-3 py-2 text-secondary-700">{date}</td>
                    <td className="border border-secondary-200 px-3 py-2 text-secondary-600">{b.startTime}</td>
                    <td className="border border-secondary-200 px-3 py-2 font-medium text-secondary-800">{b.customerName}</td>
                    <td className="border border-secondary-200 px-3 py-2 text-secondary-700 max-w-[200px]">
                      <span className="truncate block">{b.serviceName || '—'}</span>
                    </td>
                    <td className="border border-secondary-200 px-3 py-2 text-secondary-600">{b.staffName}</td>
                    <td className="border border-secondary-200 px-3 py-2 text-right font-semibold text-secondary-900">
                      {formatPrice((b.price || 0) + (b.productAmount || 0))}
                    </td>
                    <td className="border border-secondary-200 px-3 py-2 text-center">
                      {payLabel ? (
                        <Badge variant={payBadge} className="text-xs">
                          {payLabel}
                        </Badge>
                      ) : (
                        <span className="text-secondary-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-secondary-50 font-semibold">
                <td colSpan={5} className="border border-secondary-200 px-3 py-2 text-sm text-secondary-600 text-center">
                  {t('booking.total')} ({bookings.length}{t('sales.bookingUnit')})
                </td>
                <td className="border border-secondary-200 px-3 py-2 text-right text-sm font-bold text-secondary-900">
                  {formatPrice(bookings.reduce((s, b) => s + (b.price || 0) + (b.productAmount || 0), 0))}
                </td>
                <td className="border border-secondary-200 px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
