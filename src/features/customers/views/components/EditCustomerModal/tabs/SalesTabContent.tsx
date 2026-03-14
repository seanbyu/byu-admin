'use client';

import { memo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileText, Image, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import { customerQueries } from '@/features/customers/hooks/queries';
import { createBookingsApi } from '@/features/bookings/api';
import { SalesRegistrationModal } from '@/features/bookings/views/components/SalesRegistrationModal';
import type { TabContentProps } from '../types';
import type { ServiceHistoryItem } from '@/features/customers/types';
import type { Booking } from '@/features/bookings/types';
import { BookingStatus } from '@/types';

const bookingsApi = createBookingsApi();

function formatProductName(item: ServiceHistoryItem): string {
  if (item.service_items && item.service_items.length > 0) {
    return item.service_items
      .map((si) =>
        si.name ? `${si.category_name} (${si.name})` : si.category_name
      )
      .join(', ');
  }
  return item.category_name || item.service?.name || '-';
}

function toBooking(item: ServiceHistoryItem, customer: TabContentProps['customer'], salonId: string): Booking {
  return {
    id: item.id,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone || '',
    salonId,
    staffId: item.artist?.id || '',
    staffName: item.artist?.name || '',
    serviceId: item.service?.id || '',
    serviceName: formatProductName(item),
    date: item.booking_date,
    startTime: item.start_time || '',
    endTime: '',
    status: (item.status as BookingStatus) || BookingStatus.COMPLETED,
    price: item.total_price || 0,
    source: 'WALK_IN',
    notes: item.notes,
    paymentMethod: item.payment_method || '',
    productAmount: item.product_amount || 0,
    storeSalesAmount: 0,
    bookingMeta: {
      sales_registered: true,
      service_ids: item.service_items?.map((si) => si.id) || [],
      product_ids: item.product_ids || [],
      category_name: item.category_name || formatProductName(item),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const SalesTabContent = memo(function SalesTabContent({
  customer,
}: TabContentProps) {
  const t = useTranslations('customer');
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const queryClient = useQueryClient();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: chartData, isLoading } = useQuery(
    customerQueries.chart(salonId, customer.id)
  );

  const serviceHistory: ServiceHistoryItem[] = chartData?.service_history || [];

  const totalService = serviceHistory.reduce(
    (sum, item) => sum + (item.total_price || 0),
    0
  );

  const totalProduct = serviceHistory.reduce(
    (sum, item) => sum + (item.product_amount || 0),
    0
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
      bookingsApi.updateBooking(salonId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'chart'] });
      setSelectedBooking(null);
    },
  });

  const handleSave = useCallback(
    (id: string, updates: Partial<Booking>) => {
      updateMutation.mutate({ id, updates });
    },
    [updateMutation]
  );

  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center md:h-[320px]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sales Summary */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-secondary-900 md:mb-3 md:text-base">
          {t('sales.totalSummary')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 xl:grid-cols-5">
          <div className="rounded-[var(--card-radius)] border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('tabs.service')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(totalService)}
            </p>
          </div>
          <div className="rounded-[var(--card-radius)] border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('tabs.product')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(totalProduct)}
            </p>
          </div>
          <div className="rounded-[var(--card-radius)] border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('sales.membershipSales')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(0)}
            </p>
          </div>
          <div className="rounded-[var(--card-radius)] border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('sales.ticketSales')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(0)}
            </p>
          </div>
          <div className="rounded-[var(--card-radius)] border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('sales.cancellationFee')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Sales History */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-secondary-900 md:mb-3 md:text-base">
          {t('sales.history')}
        </h3>
        {serviceHistory.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center rounded-[var(--card-radius)] border border-secondary-200 text-sm text-secondary-400 md:h-[200px] md:text-base">
            {t('sales.noHistory')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('sales.date')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('sales.productName')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('sales.staff')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('sales.memo')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-secondary-500">
                    {t('sales.actualSales')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('sales.paymentMethod')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary-500">
                    {t('sales.receipt')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary-500">
                    {t('sales.photo')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary-500">
                    {t('sales.edit')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {serviceHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary-50">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-secondary-700">
                      {typeof item.booking_date === 'string'
                        ? item.booking_date
                        : new Date(item.booking_date).toISOString().slice(0, 10)}
                      {item.start_time && (
                        <span className="ml-1 text-secondary-400">
                          {item.start_time.slice(0, 5)}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[160px] px-3 py-3 text-xs text-secondary-700">
                      <span className="line-clamp-2">{formatProductName(item)}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-secondary-700">
                      {item.artist?.name || '-'}
                    </td>
                    <td className="max-w-[100px] px-3 py-3 text-xs text-secondary-500">
                      <span className="line-clamp-2">{item.notes || '-'}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-secondary-900">
                      {formatPrice((item.total_price || 0) + (item.product_amount || 0))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-secondary-700">
                      {item.payment_method || '-'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        aria-label={t('sales.receipt')}
                        className="rounded p-1 hover:bg-secondary-100"
                      >
                        <FileText className="h-4 w-4 text-secondary-400" />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        aria-label={t('sales.photo')}
                        className="rounded p-1 hover:bg-secondary-100"
                      >
                        <Image className="h-4 w-4 text-secondary-400" />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        aria-label={t('sales.edit')}
                        className="rounded p-1 hover:bg-secondary-100"
                        onClick={() => setSelectedBooking(toBooking(item, customer, salonId))}
                      >
                        <Edit2 className="h-4 w-4 text-secondary-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SalesRegistrationModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        onSave={handleSave}
      />
    </div>
  );
});
