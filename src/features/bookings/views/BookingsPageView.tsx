'use client';

import { useMemo, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { useTranslations } from 'next-intl';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { useBookings } from '../hooks/useBookings';
import { useBookingsPageState, useBookingsData } from '../hooks/useBookingsPageState';
import { salonSettingsKeys, SALON_SETTINGS_QUERY_OPTIONS } from '../hooks/queries';
import { useStaff } from '../../staff/hooks/useStaff';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatPrice } from '@/lib/utils';
import { Plus, Calendar as CalendarIcon, Filter, List } from 'lucide-react';
import { salonsApi } from '@/features/salons/api';

// bundle-dynamic-imports: 모달은 초기 로드에 필요하지 않으므로 동적 임포트
const NewBookingModal = dynamic(
  () => import('../components/NewBookingModal'),
  { ssr: false }
);

// rendering-hoist-jsx: 정적 상수를 컴포넌트 외부로 호이스팅
const STATUS_OPTIONS = [
  { value: '', label: 'common.all' },
  { value: BookingStatus.PENDING, label: 'booking.pending' },
  { value: BookingStatus.CONFIRMED, label: 'booking.confirmed' },
  { value: BookingStatus.COMPLETED, label: 'booking.completed' },
  { value: BookingStatus.CANCELLED, label: 'booking.cancelled' },
] as const;

// rerender-memo: 비싼 렌더링 작업을 메모이제이션
const StatusBadge = memo(function StatusBadge({
  variant,
  label,
}: {
  variant: 'warning' | 'info' | 'success' | 'danger' | 'default';
  label: string;
}) {
  return <Badge variant={variant}>{label}</Badge>;
});

// ViewModeToggle을 별도 컴포넌트로 분리 (rerender-memo)
const ViewModeToggle = memo(function ViewModeToggle({
  viewMode,
  onCalendarClick,
  onTableClick,
  calendarLabel,
  listLabel,
}: {
  viewMode: 'calendar' | 'table';
  onCalendarClick: () => void;
  onTableClick: () => void;
  calendarLabel: string;
  listLabel: string;
}) {
  return (
    <div className="flex border border-secondary-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
          viewMode === 'calendar'
            ? 'bg-primary-500 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={onCalendarClick}
      >
        <CalendarIcon size={18} />
        <span>{calendarLabel}</span>
      </button>
      <button
        type="button"
        className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
          viewMode === 'table'
            ? 'bg-primary-500 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={onTableClick}
      >
        <List size={18} />
        <span>{listLabel}</span>
      </button>
    </div>
  );
});

// 필터 섹션 분리 (rerender-memo)
const BookingFilters = memo(function BookingFilters({
  selectedDate,
  statusFilter,
  selectedStaffId,
  designers,
  onDateChange,
  onStatusChange,
  onStaffChange,
  t,
}: {
  selectedDate: Date;
  statusFilter: string;
  selectedStaffId: string;
  designers: Array<{ value: string; label: string }>;
  onDateChange: (date: Date) => void;
  onStatusChange: (status: string) => void;
  onStaffChange: (id: string) => void;
  t: (key: string) => string;
}) {
  // useMemo로 상태 옵션 번역 (js-cache-function-results)
  const translatedStatusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(opt.label),
      })),
    [t]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDateChange(new Date(e.target.value));
    },
    [onDateChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStatusChange(e.target.value);
    },
    [onStatusChange]
  );

  const handleStaffChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStaffChange(e.target.value);
    },
    [onStaffChange]
  );

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          type="date"
          label={t('booking.date')}
          value={formatDate(selectedDate, 'yyyy-MM-dd')}
          onChange={handleDateChange}
        />
        <Select
          label={t('booking.status')}
          options={translatedStatusOptions}
          value={statusFilter}
          onChange={handleStatusChange}
          showPlaceholder={false}
        />
        <Select
          label={t('booking.designer')}
          options={[{ value: '', label: t('common.all') }, ...designers]}
          value={selectedStaffId}
          onChange={handleStaffChange}
          showPlaceholder={false}
        />
        <div className="flex items-end">
          <Button variant="outline" className="w-full">
            <Filter size={20} className="mr-2" />
            {t('common.actions.applyFilter')}
          </Button>
        </div>
      </div>
    </Card>
  );
});

export default function BookingsPageView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // Custom hooks로 상태 관리 분리 (Zustand 기반)
  const pageState = useBookingsPageState();

  // 데이터 fetching (TanStack Query)
  const { bookings, isLoading } = useBookings(salonId, {
    enabled: !!salonId,
  });

  const { staffData: staffMembers } = useStaff(salonId, {
    enabled: !!salonId,
  });

  // slotDuration 설정 로드 (TanStack Query with optimized options)
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

  // 데이터 변환 (useMemo 내부에서 처리)
  const { designers, calendarResources, calendarEvents } = useBookingsData(
    bookings,
    staffMembers,
    pageState.getStatusColor
  );

  // 테이블 컬럼 정의 (useMemo로 메모이제이션)
  const columns = useMemo(
    () => [
      {
        key: 'customerName',
        header: t('booking.customer'),
        render: (booking: Booking) => (
          <div>
            <p className="font-medium">{booking.customerName}</p>
            <p className="text-xs text-secondary-500">{booking.customerPhone}</p>
          </div>
        ),
      },
      {
        key: 'serviceName',
        header: t('booking.service'),
      },
      {
        key: 'date',
        header: t('booking.date'),
        render: (booking: Booking) => formatDate(booking.date, 'yyyy-MM-dd'),
      },
      {
        key: 'time',
        header: t('booking.time'),
        render: (booking: Booking) => `${booking.startTime} - ${booking.endTime}`,
      },
      {
        key: 'price',
        header: t('booking.price'),
        render: (booking: Booking) => formatPrice(booking.price),
      },
      {
        key: 'status',
        header: t('booking.status'),
        render: (booking: Booking) => (
          <StatusBadge
            variant={pageState.getStatusBadgeVariant(booking.status)}
            label={t(`booking.${booking.status.toLowerCase()}`)}
          />
        ),
      },
      {
        key: 'source',
        header: t('booking.source'),
        render: (booking: Booking) => {
          const sourceLabels: Record<string, string> = {
            ONLINE: t('booking.online'),
            PHONE: t('booking.phone'),
            WALK_IN: t('booking.walkIn'),
          };
          return sourceLabels[booking.source] || booking.source;
        },
      },
    ],
    [t, pageState.getStatusBadgeVariant]
  );

  // 이벤트 핸들러 (useCallback으로 안정적 참조)
  const handleEventClick = useCallback(
    (event: { id: string }) => {
      const booking = bookings.find((b: Booking) => b.id === event.id);
      if (booking) {
        pageState.openBookingDetailModal(booking);
      }
    },
    [bookings, pageState.openBookingDetailModal]
  );

  const handleRowClick = useCallback((booking: Booking) => {
    pageState.openBookingDetailModal(booking);
  }, [pageState.openBookingDetailModal]);

  const handleViewModeCalendar = useCallback(() => {
    pageState.setViewMode('calendar');
  }, [pageState.setViewMode]);

  const handleViewModeTable = useCallback(() => {
    pageState.setViewMode('table');
  }, [pageState.setViewMode]);

  // js-early-exit: 로딩 상태 조기 반환
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              {t('booking.title')}
            </h1>
            <p className="text-secondary-600 mt-1">
              {t('booking.pageDescription')}
            </p>
          </div>
          <div className="flex space-x-3">
            <ViewModeToggle
              viewMode={pageState.viewMode}
              onCalendarClick={handleViewModeCalendar}
              onTableClick={handleViewModeTable}
              calendarLabel={t('common.calendar.view')}
              listLabel={t('common.calendar.list')}
            />
            <Button variant="primary" onClick={pageState.openNewBookingModal}>
              <Plus size={20} className="mr-2" />
              {t('booking.new')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <BookingFilters
          selectedDate={pageState.selectedDate}
          statusFilter={pageState.statusFilter}
          selectedStaffId={pageState.selectedStaffId}
          designers={designers}
          onDateChange={pageState.setSelectedDate}
          onStatusChange={pageState.setStatusFilter}
          onStaffChange={pageState.setSelectedStaffId}
          t={t}
        />

        {/* Calendar or Table View - rendering-conditional-render: 삼항 연산자 사용 */}
        {pageState.viewMode === 'calendar' ? (
          <Calendar
            selectedDate={pageState.selectedDate}
            onDateSelect={pageState.setSelectedDate}
            events={calendarEvents}
            resources={calendarResources}
            onEventClick={handleEventClick}
            onTimeSlotClick={pageState.handleTimeSlotClick}
            slotDuration={slotDuration}
            salonBusinessHours={businessHours}
          />
        ) : (
          <Card>
            <Table data={bookings} columns={columns} onRowClick={handleRowClick} />
          </Card>
        )}
      </div>

      {/* Modals - bundle-conditional: 조건부 렌더링으로 번들 최적화 */}
      {pageState.showNewBookingModal && (
        <NewBookingModal
          isOpen={pageState.showNewBookingModal}
          onClose={pageState.closeNewBookingModal}
          selectedDate={pageState.selectedDate}
          selectedTime={pageState.selectedTime}
          selectedStaffId={pageState.selectedStaffId}
          selectedServiceId={pageState.selectedServiceId}
          designers={designers}
          onDateChange={pageState.setSelectedDate}
          onTimeChange={pageState.setSelectedTime}
          onStaffChange={pageState.setSelectedStaffId}
          onServiceChange={pageState.setSelectedServiceId}
        />
      )}

      {/* 예약 상세 모달 (수정용) */}
      {pageState.showBookingDetailModal && pageState.selectedBooking && (
        <NewBookingModal
          isOpen={pageState.showBookingDetailModal}
          onClose={pageState.closeBookingDetailModal}
          selectedDate={new Date(pageState.selectedBooking.date)}
          selectedTime={pageState.selectedBooking.startTime}
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
