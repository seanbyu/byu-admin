'use client';

import { useMemo, useCallback, useEffect, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { useBookings } from '../hooks/useBookings';
import { useBookingsPageState, useBookingsData } from '../hooks/useBookingsPageState';
import { salonSettingsKeys, SALON_SETTINGS_QUERY_OPTIONS } from '../hooks/queries';
import { useStaff } from '../../staff/hooks/useStaff';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { Plus } from 'lucide-react';
import { salonsApi } from '@/features/salons/api';
import { StaffDaySheetView } from './components/StaffDaySheetView';

// bundle-dynamic-imports: 모달은 초기 로드에 필요하지 않으므로 동적 임포트
const NewBookingModal = dynamic(
  () => import('./components/NewBookingModal'),
  { ssr: false }
);

// rendering-hoist-jsx: 정적 상수를 컴포넌트 외부로 호이스팅
const STATUS_OPTIONS = [
  { value: '', label: 'common.all' },
  { value: BookingStatus.PENDING, label: 'booking.pending' },
  { value: BookingStatus.CONFIRMED, label: 'booking.confirmed' },
  { value: BookingStatus.IN_PROGRESS, label: 'booking.inProgress' },
  { value: BookingStatus.COMPLETED, label: 'booking.completed' },
  { value: BookingStatus.CANCELLED, label: 'booking.cancelled' },
] as const;

const parseLocalDate = (value: Date | string): Date => {
  if (value instanceof Date) return value;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

// 필터 섹션
const BookingFilters = memo(function BookingFilters({
  statusFilter,
  selectedStaffId,
  designers,
  onStatusChange,
  onStaffChange,
  t,
}: {
  statusFilter: string;
  selectedStaffId: string;
  designers: Array<{ value: string; label: string }>;
  onStatusChange: (status: string) => void;
  onStaffChange: (id: string) => void;
  t: (key: string) => string;
}) {
  const translatedStatusOptions = useMemo(
    () => STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.label) })),
    [t]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStatusChange(e.target.value);
    },
    [onStatusChange]
  );

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label={t('booking.status')}
            options={translatedStatusOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            showPlaceholder={false}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {t('booking.designer')}
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onStaffChange('')}
              className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap transition-colors ${
                selectedStaffId === ''
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              {t('common.all')}
            </button>
            {designers.map((designer) => (
              <button
                key={designer.value}
                type="button"
                onClick={() => onStaffChange(designer.value)}
                className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap transition-colors ${
                  selectedStaffId === designer.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
                }`}
              >
                {designer.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
});

export default function BookingsPageView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const { canWrite } = usePermission();
  const canCreateBooking = canWrite(PermissionModules.BOOKINGS);

  const pageState = useBookingsPageState();

  const { bookings, isLoading, updateBooking } = useBookings(salonId, {
    enabled: !!salonId,
  });

  const { staffData: staffMembers } = useStaff(salonId, {
    enabled: !!salonId,
  });

  const { data: settingsResponse } = useQuery({
    queryKey: salonSettingsKeys.detail(salonId),
    queryFn: () => salonsApi.getSettings(salonId),
    enabled: !!salonId,
    ...SALON_SETTINGS_QUERY_OPTIONS,
  });

  const slotDuration = useMemo(
    () => settingsResponse?.data?.settings?.slot_duration_minutes || 30,
    [settingsResponse?.data?.settings?.slot_duration_minutes]
  );

  const businessHours = useMemo(
    () => settingsResponse?.data?.businessHours || [],
    [settingsResponse?.data?.businessHours]
  );

  // 상태·직원 필터만 적용 (날짜 필터는 현황판 내부에서 처리)
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (pageState.statusFilter && booking.status !== pageState.statusFilter) return false;
      if (pageState.selectedStaffId && booking.staffId !== pageState.selectedStaffId) return false;
      return true;
    });
  }, [bookings, pageState.statusFilter, pageState.selectedStaffId]);

  const { designers } = useBookingsData(
    filteredBookings,
    staffMembers,
    pageState.getStatusColor
  );

  const handleSheetUpdateBooking = useCallback(
    (id: string, updates: Partial<Booking>) => {
      updateBooking({ id, updates });
    },
    [updateBooking]
  );

  // 알림 클릭 → 스크롤 + 하이라이트 해제
  const highlightedBookingId = pageState.highlightedBookingId;
  const setHighlightedBookingId = pageState.setHighlightedBookingId;
  useEffect(() => {
    if (!highlightedBookingId) return;

    // 페이지 이동 후 데이터 로딩 완료까지 대기하며 스크롤 시도
    let attempts = 0;
    const maxAttempts = 10;
    const tryScroll = () => {
      const el = document.querySelector(`[data-booking-id="${highlightedBookingId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < maxAttempts) {
        attempts++;
        scrollRetry = setTimeout(tryScroll, 300);
      }
    };
    let scrollRetry = setTimeout(tryScroll, 300);

    const clearTimer = setTimeout(() => {
      setHighlightedBookingId(null);
    }, 5000);

    return () => { clearTimeout(scrollRetry); clearTimeout(clearTimer); };
  }, [highlightedBookingId, setHighlightedBookingId]);

  const handleSheetAddBooking = useCallback(
    (staffId: string, time?: string) => {
      pageState.setSelectedStaffId(staffId);
      if (time) pageState.setSelectedTime(time);
      pageState.openNewBookingModal();
    },
    [pageState.setSelectedStaffId, pageState.setSelectedTime, pageState.openNewBookingModal]
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
              {t('booking.title')}
            </h1>
            <p className="text-sm md:text-base text-secondary-600 mt-1">
              {t('booking.pageDescription')}
            </p>
          </div>
          {canCreateBooking && (
            <Button
              variant="primary"
              onClick={pageState.openNewBookingModal}
              className="text-sm px-3 py-2 md:px-4 md:py-2.5"
            >
              <Plus size={18} className="mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">{t('booking.new')}</span>
            </Button>
          )}
        </div>

        {/* 필터 */}
        <BookingFilters
          statusFilter={pageState.statusFilter}
          selectedStaffId={pageState.selectedStaffId}
          designers={designers}
          onStatusChange={pageState.setStatusFilter}
          onStaffChange={pageState.setSelectedStaffId}
          t={t}
        />

        {/* 현황판 */}
        <Card>
          <StaffDaySheetView
            bookings={filteredBookings}
            staffMembers={staffMembers}
            selectedDate={pageState.selectedDate}
            selectedStaffId={pageState.selectedStaffId}
            onDateChange={pageState.setSelectedDate}
            businessHours={businessHours}
            slotDuration={slotDuration}
            onBookingClick={pageState.openBookingDetailModal}
            onAddBooking={handleSheetAddBooking}
            onUpdateBooking={handleSheetUpdateBooking}
            highlightedBookingId={highlightedBookingId}
          />
        </Card>
      </div>

      {/* 새 예약 모달 */}
      {pageState.showNewBookingModal && (
        <NewBookingModal
          isOpen={pageState.showNewBookingModal}
          onClose={pageState.closeNewBookingModal}
          selectedDate={pageState.selectedDate}
          selectedTime={pageState.selectedTime}
          slotDuration={slotDuration}
          businessHours={businessHours}
          selectedStaffId={pageState.selectedStaffId}
          selectedServiceId={pageState.selectedServiceId}
          designers={designers}
          onDateChange={pageState.setSelectedDate}
          onTimeChange={pageState.setSelectedTime}
          onStaffChange={pageState.setSelectedStaffId}
          onServiceChange={pageState.setSelectedServiceId}
        />
      )}

      {/* 예약 상세 모달 */}
      {pageState.showBookingDetailModal && pageState.selectedBooking && (
        <NewBookingModal
          isOpen={pageState.showBookingDetailModal}
          onClose={pageState.closeBookingDetailModal}
          selectedDate={parseLocalDate(pageState.selectedBooking.date)}
          selectedTime={pageState.selectedBooking.startTime}
          slotDuration={slotDuration}
          businessHours={businessHours}
          selectedStaffId={pageState.selectedBooking.staffId}
          selectedServiceId={pageState.selectedBooking.serviceId}
          designers={designers}
          onDateChange={pageState.setSelectedDate}
          onTimeChange={pageState.setSelectedTime}
          onStaffChange={pageState.setSelectedStaffId}
          onServiceChange={pageState.setSelectedServiceId}
          editBooking={pageState.selectedBooking}
        />
      )}
    </Layout>
  );
}
