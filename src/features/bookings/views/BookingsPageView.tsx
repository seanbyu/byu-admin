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
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  Plus,
  Calendar as CalendarIcon,
  List,
  LayoutList,
} from 'lucide-react';
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
  onSheetClick,
  calendarLabel,
  listLabel,
  sheetLabel,
}: {
  viewMode: 'calendar' | 'table' | 'sheet';
  onCalendarClick: () => void;
  onTableClick: () => void;
  onSheetClick: () => void;
  calendarLabel: string;
  listLabel: string;
  sheetLabel: string;
}) {
  return (
    <div className="flex w-full md:w-auto border border-secondary-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className={`flex-1 md:flex-none px-2.5 sm:px-3 md:px-4 py-2 flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm transition-colors ${
          viewMode === 'calendar'
            ? 'bg-primary-500 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={onCalendarClick}
      >
        <CalendarIcon size={16} />
        <span className="truncate">{calendarLabel}</span>
      </button>
      <button
        type="button"
        className={`flex-1 md:flex-none px-2.5 sm:px-3 md:px-4 py-2 flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm transition-colors border-l border-secondary-200 ${
          viewMode === 'sheet'
            ? 'bg-primary-500 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={onSheetClick}
      >
        <LayoutList size={16} />
        <span className="truncate">{sheetLabel}</span>
      </button>
      <button
        type="button"
        className={`flex-1 md:flex-none px-2.5 sm:px-3 md:px-4 py-2 flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm transition-colors border-l border-secondary-200 ${
          viewMode === 'table'
            ? 'bg-primary-500 text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={onTableClick}
      >
        <List size={16} />
        <span className="truncate">{listLabel}</span>
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

  return (
    <Card className="sticky top-[72px] z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="md:col-span-2">
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

  // 권한 체크
  const { canWrite } = usePermission();
  const canCreateBooking = canWrite(PermissionModules.BOOKINGS);

  // Custom hooks로 상태 관리 분리 (Zustand 기반)
  const pageState = useBookingsPageState();

  // 데이터 fetching (TanStack Query)
  const { bookings, isLoading, updateBooking } = useBookings(salonId, {
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

  const filteredBookingsByStaffAndStatus = useMemo(() => {
    return bookings.filter((booking) => {
      if (pageState.statusFilter && booking.status !== pageState.statusFilter) {
        return false;
      }
      if (pageState.selectedStaffId && booking.staffId !== pageState.selectedStaffId) {
        return false;
      }
      return true;
    });
  }, [bookings, pageState.statusFilter, pageState.selectedStaffId]);

  const filteredBookingsByDate = useMemo(() => {
    const selectedDateStr = formatDate(pageState.selectedDate, 'yyyy-MM-dd');
    return filteredBookingsByStaffAndStatus.filter((booking) => {
      const bookingDateStr = formatDate(booking.date, 'yyyy-MM-dd');
      return bookingDateStr === selectedDateStr;
    });
  }, [filteredBookingsByStaffAndStatus, pageState.selectedDate]);

  // 데이터 변환 (useMemo 내부에서 처리)
  const { designers, calendarResources, calendarEvents } = useBookingsData(
    filteredBookingsByStaffAndStatus,
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

  const handleViewModeSheet = useCallback(() => {
    pageState.setViewMode('sheet');
  }, [pageState.setViewMode]);

  // 시트 뷰에서 가격 인라인 수정
  const handleSheetUpdateBooking = useCallback(
    (id: string, updates: { price: number }) => {
      updateBooking({ id, updates });
    },
    [updateBooking]
  );

  // 시트 뷰에서 직원 + 시간 선택 시 예약 추가
  const handleSheetAddBooking = useCallback(
    (staffId: string, time?: string) => {
      pageState.setSelectedStaffId(staffId);
      if (time) pageState.setSelectedTime(time);
      pageState.openNewBookingModal();
    },
    [pageState.setSelectedStaffId, pageState.setSelectedTime, pageState.openNewBookingModal]
  );

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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
              {t('booking.title')}
            </h1>
            <p className="text-sm md:text-base text-secondary-600 mt-1">
              {t('booking.pageDescription')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <ViewModeToggle
              viewMode={pageState.viewMode}
              onCalendarClick={handleViewModeCalendar}
              onTableClick={handleViewModeTable}
              onSheetClick={handleViewModeSheet}
              calendarLabel={t('common.calendar.view')}
              listLabel={t('common.calendar.list')}
              sheetLabel={t('common.calendar.sheet')}
            />
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

        {/* View 렌더링 */}
        {pageState.viewMode === 'calendar' && (
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
        )}
        {pageState.viewMode === 'sheet' && (
          <Card>
            <StaffDaySheetView
              bookings={filteredBookingsByDate}
              staffMembers={staffMembers}
              selectedDate={pageState.selectedDate}
              selectedStaffId={pageState.selectedStaffId}
              onDateChange={pageState.setSelectedDate}
              businessHours={businessHours}
              slotDuration={slotDuration}
              onBookingClick={pageState.openBookingDetailModal}
              onAddBooking={handleSheetAddBooking}
              onUpdateBooking={handleSheetUpdateBooking}
            />
          </Card>
        )}
        {pageState.viewMode === 'table' && (
          <Card>
            <Table
              data={filteredBookingsByDate}
              columns={columns}
              onRowClick={handleRowClick}
            />
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
