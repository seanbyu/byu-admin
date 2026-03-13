'use client';

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import { customerQueries } from '@/features/customers/hooks/queries';
import { useProducts } from '@/features/products/hooks/useProducts';
import type { CustomerListItem, ServiceHistoryItem } from '@/features/customers/types';

interface ProductTabContentProps {
  customer: CustomerListItem;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  return d;
}

export const ProductTabContent = memo(function ProductTabContent({
  customer,
}: ProductTabContentProps) {
  const t = useTranslations('customer');
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const { data: chartData, isLoading: isChartLoading } = useQuery(
    customerQueries.chart(salonId, customer.id)
  );
  const { products, isLoading: isProductsLoading } = useProducts(salonId);

  const productMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [products]);

  const productHistory: ServiceHistoryItem[] = useMemo(
    () => (chartData?.service_history || []).filter((item) => (item.product_amount || 0) > 0),
    [chartData]
  );

  const isLoading = isChartLoading || isProductsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center md:h-[320px] lg:h-[400px]">
        <Spinner size="md" />
      </div>
    );
  }

  if (productHistory.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-secondary-400 md:h-[320px] md:text-base lg:h-[400px]">
        {t('productTab.noHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {productHistory.map((item) => {
        const productNames = (item.product_ids || [])
          .map((id) => productMap[id])
          .filter(Boolean);

        return (
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

            {/* 제품 목록 */}
            {productNames.length > 0 ? (
              <div className="space-y-1">
                {productNames.map((name, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-secondary-800 sm:text-base">{name}</span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-secondary-100 pt-2">
                  <span className="text-xs font-semibold text-secondary-600 sm:text-sm">Total</span>
                  <span className="text-sm font-bold text-primary-600 sm:text-base">
                    {formatPrice(item.product_amount || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-500 sm:text-base">—</span>
                <span className="text-sm font-bold text-primary-600 sm:text-base">
                  {formatPrice(item.product_amount || 0)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
