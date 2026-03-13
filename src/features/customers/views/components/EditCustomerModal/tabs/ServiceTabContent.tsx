'use client';

import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import { customerQueries } from '@/features/customers/hooks/queries';
import type { CustomerListItem, ServiceHistoryItem } from '@/features/customers/types';

interface ServiceTabContentProps {
  customer: CustomerListItem;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  return d;
}

export const ServiceTabContent = memo(function ServiceTabContent({
  customer,
}: ServiceTabContentProps) {
  const t = useTranslations('customer');
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const { data: chartData, isLoading } = useQuery(
    customerQueries.chart(salonId, customer.id)
  );

  const serviceHistory: ServiceHistoryItem[] = chartData?.service_history || [];

  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center md:h-[320px] lg:h-[400px]">
        <Spinner size="md" />
      </div>
    );
  }

  if (serviceHistory.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-secondary-400 md:h-[320px] md:text-base lg:h-[400px]">
        {t('serviceTab.noHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {serviceHistory.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-secondary-200 bg-white p-3 sm:p-4"
        >
          {/* 헤더: 날짜 + 담당자 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-secondary-500 sm:text-sm">
              {formatDate(item.booking_date)}{' '}
              {item.start_time?.slice(0, 5)}
            </span>
            {item.artist?.name && (
              <span className="text-xs text-secondary-500 sm:text-sm">
                {item.artist.name}
              </span>
            )}
          </div>

          {/* 시술 항목 목록 */}
          {item.service_items && item.service_items.length > 0 ? (
            <div className="space-y-1">
              {item.service_items.map((si) => (
                <div key={si.id} className="flex items-center justify-between">
                  <span className="text-sm text-secondary-800 sm:text-base">
                    {si.category_name}
                    {si.name ? (
                      <span className="text-secondary-500"> ({si.name})</span>
                    ) : null}
                  </span>
                  <span className="text-sm font-medium text-secondary-800 sm:text-base">
                    {formatPrice(si.price)}
                  </span>
                </div>
              ))}

              {/* 구분선 + 합계 */}
              <div className="mt-2 flex items-center justify-between border-t border-secondary-100 pt-2">
                <span className="text-xs font-semibold text-secondary-600 sm:text-sm">
                  Total
                </span>
                <span className="text-sm font-bold text-primary-600 sm:text-base">
                  {formatPrice(item.total_price || 0)}
                </span>
              </div>
            </div>
          ) : (
            /* service_items 없을 경우 (매출 미등록 예약) — category_name + 합계만 표시 */
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-800 sm:text-base">
                {item.category_name || item.service?.name || '-'}
              </span>
              <span className="text-sm font-bold text-primary-600 sm:text-base">
                {formatPrice(item.total_price || 0)}
              </span>
            </div>
          )}

          {/* 시술 메모 */}
          {item.notes && (
            <p className="mt-2 rounded bg-secondary-50 px-2.5 py-1.5 text-xs text-secondary-700 sm:text-sm">
              {item.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
});
