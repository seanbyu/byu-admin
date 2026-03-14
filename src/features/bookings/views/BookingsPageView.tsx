'use client';

import { useMemo, useCallback, useEffect, memo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { useBookings } from '../hooks/useBookings';
import { useBookingsPageState, useBookingsData } from '../hooks/useBookingsPageState';
import { useBookingNotificationStatuses } from '../hooks/useBookingNotificationStatuses';
import { useSalonSettings } from '../hooks/useSalonSettings';
import { useStaff } from '../../staff/hooks/useStaff';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { Plus, ChevronDown } from 'lucide-react';
import { BookingsChartSkeleton } from '@/components/ui/Skeleton';
import { StaffDaySheetView } from './components/StaffDaySheetView';
import { StaffSelectorSheet } from './components/StaffSelectorSheet';

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
  selectedStaffIds,
  artists,
  onStatusChange,
  onOpenStaffSheet,
  t,
}: {
  statusFilter: string;
  selectedStaffIds: string[];
  artists: Array<{ value: string; label: string }>;
  onStatusChange: (status: string) => void;
  onOpenStaffSheet: () => void;
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

  // 버튼 라벨: 전체 or 선택된 직원 이름들
  const staffButtonLabel = useMemo(() => {
    if (selectedStaffIds.length === 0) return t('common.all');
    if (selectedStaffIds.length === 1) {
      return artists.find((a) => a.value === selectedStaffIds[0])?.label ?? t('common.all');
    }
    return `${selectedStaffIds.length}${t('booking.staffCount') || '명'}`;
  }, [selectedStaffIds, artists, t]);

  const isFiltered = selectedStaffIds.length > 0;

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-32">
          <Select
            label={t('booking.status')}
            options={translatedStatusOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            showPlaceholder={false}
            className="py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('booking.designer')}
          </label>
          <button
            type="button"
            onClick={onOpenStaffSheet}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--btn-radius)] border text-sm transition-colors ${
              isFiltered
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
            }`}
          >
            <span>{staffButtonLabel}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
});

export default function BookingsPageView({ isChart }: { isChart?: boolean } = {}) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const searchParams = useSearchParams();
  const [showStaffSheet, setShowStaffSheet] = useState(false);

  const { canWrite } = usePermission();
  const canCreateBooking = canWrite(PermissionModules.BOOKINGS);

  const pageState = useBookingsPageState();

  const { bookings, isLoading, updateBooking } = useBookings(salonId, {
    enabled: !!salonId,
  });

  const { staffData: staffMembers, isLoading: isStaffLoading } = useStaff(salonId, {
    enabled: !!salonId,
  });

  const { data: settingsData, isLoading: isSettingsLoading } = useSalonSettings(salonId);

  const slotDuration = useMemo(
    () => settingsData?.settings?.slot_duration_minutes || 30,
    [settingsData?.settings?.slot_duration_minutes]
  );

  const selectedDateStr = useMemo(() => {
    const d = pageState.selectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [pageState.selectedDate]);

  const { data: notificationStatuses } = useBookingNotificationStatuses(salonId, selectedDateStr);

  const businessHours = useMemo(
    () => settingsData?.businessHours || [],
    [settingsData?.businessHours]
  );

  // 상태·직원 필터 적용 (날짜 필터는 현황판 내부에서 처리)
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (pageState.statusFilter && booking.status !== pageState.statusFilter) return false;
      if (
        pageState.selectedStaffIds.length > 0 &&
        !pageState.selectedStaffIds.includes(booking.staffId)
      ) return false;
      return true;
    });
  }, [bookings, pageState.statusFilter, pageState.selectedStaffIds]);

  const { artists } = useBookingsData(
    filteredBookings,
    staffMembers,
    pageState.getStatusColor
  );

  // 다른 살롱 계정으로 전환 시 localStorage에 남은 잘못된 직원 ID 자동 제거
  useEffect(() => {
    if (artists.length === 0) return;
    const validIds = new Set(artists.map((a) => a.value));
    const cleaned = pageState.selectedStaffIds.filter((id) => validIds.has(id));
    if (cleaned.length !== pageState.selectedStaffIds.length) {
      pageState.setSelectedStaffIds(cleaned);
    }
  // artists가 로드된 직후 1회만 실행하면 충분
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists]);

  const handleSheetUpdateBooking = useCallback(
    (id: string, updates: Partial<Booking>) => {
      updateBooking({ id, updates });
    },
    [updateBooking]
  );

  // ── 알림 클릭 처리 (URL 파라미터 방식) ────────────────────────────────
  const highlightParam    = searchParams.get('highlight');
  const dateParam         = searchParams.get('date');
  const staffParam        = searchParams.get('staff');
  const { setSelectedDate, setSelectedStaffId, setSelectedStaffIds, setHighlightedBookingId } = pageState;

  // 1) URL 파라미터 → Zustand 상태 설정 (데이터 로딩 완료 시점에 실행)
  useEffect(() => {
    if (!highlightParam || isLoading || isSettingsLoading) return;

    if (dateParam)  setSelectedDate(new Date(dateParam + 'T00:00:00'));
    if (staffParam) {
      setSelectedStaffId(staffParam);
      // 해당 직원이 필터에 체크된 상태로, 그 직원 테이블만 표시
      setSelectedStaffIds([staffParam]);
    } else {
      setSelectedStaffIds([]);
    }
    setHighlightedBookingId(highlightParam);

    // router.replace 대신 history API로 URL 정리
    window.history.replaceState(null, '', window.location.pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightParam, isLoading, isSettingsLoading]);

  // 2) highlightedBookingId 변경 시 스크롤
  //    필터 변경 → 리렌더 → DOM 반영까지 여러 패스가 필요하므로
  //    요소를 찾을 때까지 100ms 간격으로 최대 10회 재시도 (모바일 대응)
  const highlightedBookingId = pageState.highlightedBookingId;
  useEffect(() => {
    if (!highlightedBookingId) return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tryScroll = () => {
      const all = document.querySelectorAll(`[data-booking-id="${highlightedBookingId}"]`);
      const el  = Array.from(all).find((e) => (e as HTMLElement).offsetParent !== null);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (++attempts < 10) {
        timer = setTimeout(tryScroll, 100);
      }
    };

    timer = setTimeout(tryScroll, 100);
    const clearTimer = setTimeout(() => setHighlightedBookingId(null), 5000);

    return () => { clearTimeout(timer); clearTimeout(clearTimer); };
  }, [highlightedBookingId, setHighlightedBookingId]);

  const handleSheetAddBooking = useCallback(
    (staffId: string, time?: string) => {
      pageState.setSelectedStaffId(staffId);
      if (time) pageState.setSelectedTime(time);
      pageState.openNewBookingModal();
    },
    [pageState.setSelectedStaffId, pageState.setSelectedTime, pageState.openNewBookingModal]
  );

  // salonId가 아직 없으면 (auth hydration 전) 렌더 차단
  if (!salonId || isLoading || isStaffLoading || isSettingsLoading || !settingsData) {
    return <BookingsChartSkeleton />;
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-h1">
              {t(isChart ? 'booking.chartTitle' : 'booking.title')}
            </h1>
            <p className="text-body mt-1">
              {t(isChart ? 'booking.chartDescription' : 'booking.pageDescription')}
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
          selectedStaffIds={pageState.selectedStaffIds}
          artists={artists}
          onStatusChange={pageState.setStatusFilter}
          onOpenStaffSheet={() => setShowStaffSheet(true)}
          t={t}
        />

        {/* 현황판 */}
        <Card>
          <StaffDaySheetView
            bookings={filteredBookings}
            staffMembers={staffMembers}
            selectedDate={pageState.selectedDate}
            selectedStaffId={pageState.selectedStaffId}
            selectedStaffIds={pageState.selectedStaffIds}
            onDateChange={pageState.setSelectedDate}
            businessHours={businessHours}
            slotDuration={slotDuration}
            onBookingClick={pageState.openBookingDetailModal}
            onAddBooking={handleSheetAddBooking}
            onUpdateBooking={handleSheetUpdateBooking}
            highlightedBookingId={highlightedBookingId}
            notificationStatuses={notificationStatuses}
          />
        </Card>
      </div>

      {/* 담당자 선택 바텀시트 */}
      <StaffSelectorSheet
        isOpen={showStaffSheet}
        onClose={() => setShowStaffSheet(false)}
        artists={artists}
        selectedStaffIds={pageState.selectedStaffIds}
        onChangeStaffIds={pageState.setSelectedStaffIds}
      />

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
          artists={artists}
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
          artists={artists}
          onDateChange={pageState.setSelectedDate}
          onTimeChange={pageState.setSelectedTime}
          onStaffChange={pageState.setSelectedStaffId}
          onServiceChange={pageState.setSelectedServiceId}
          editBooking={pageState.selectedBooking}
        />
      )}
    </>
  );
}
