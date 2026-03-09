'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { useSales } from '../hooks/useSales';
import { SalesFilterBar } from './components/SalesFilterBar';
import { SalesSummaryCards } from './components/SalesSummaryCards';
import { SalesByPayment } from './components/SalesByPayment';
import { SalesByStaff } from './components/SalesByStaff';
import { SalesByMenu } from './components/SalesByMenu';
import { SalesTable } from './components/SalesTable';

export function SalesPageView() {
  const t = useTranslations('sales');
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const {
    filters,
    applyPreset,
    applyCustomRange,
    bookings,
    isLoading,
    summary,
    byPayment,
    byStaff,
    byMenu,
  } = useSales(salonId);

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-h2 text-secondary-900">{t('title')}</h1>
        <SalesFilterBar
          filters={filters}
          onPreset={applyPreset}
          onCustomRange={applyCustomRange}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <SalesSummaryCards summary={summary} />

          {/* 통계 패널 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SalesByPayment data={byPayment} totalRevenue={summary.totalRevenue} />
            <div className="lg:col-span-2">
              <SalesByStaff data={byStaff} />
            </div>
          </div>

          <SalesByMenu data={byMenu} totalRevenue={summary.serviceRevenue} />

          {/* 매출 목록 */}
          <SalesTable bookings={bookings} />
        </>
      )}
    </div>
  );
}
