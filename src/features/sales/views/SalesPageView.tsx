'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { SalesPageSkeleton } from '@/components/ui/Skeleton';
import { createBookingsApi } from '@/features/bookings/api';
import { SalesRegistrationModal } from '@/features/bookings/views/components/SalesRegistrationModal';
import { useSales } from '../hooks/useSales';
import { SalesFilterBar } from './components/SalesFilterBar';
import { SalesSummaryCards } from './components/SalesSummaryCards';
import { SalesByPayment } from './components/SalesByPayment';
import { SalesByStaff } from './components/SalesByStaff';
import { SalesByMenu } from './components/SalesByMenu';
import { SalesTable } from './components/SalesTable';
import type { Booking } from '@/features/bookings/types';

const bookingsApi = createBookingsApi();

export function SalesPageView() {
  const t = useTranslations('sales');
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const queryClient = useQueryClient();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
      bookingsApi.updateBooking(salonId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  const handleSave = useCallback(
    (id: string, updates: Partial<Booking>) => {
      updateMutation.mutate({ id, updates });
    },
    [updateMutation]
  );

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-h2 text-secondary-900">{t('title')}</h1>
        <SalesFilterBar
          filters={filters}
          onPreset={applyPreset}
          onCustomRange={applyCustomRange}
        />
      </div>

      {isLoading ? (
        <SalesPageSkeleton />
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
          <SalesTable bookings={bookings} onRowClick={setSelectedBooking} />
        </>
      )}

      {/* 매출 수정 모달 */}
      <SalesRegistrationModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        onSave={handleSave}
      />
    </div>
  );
}
