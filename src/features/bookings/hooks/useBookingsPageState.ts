'use client';

import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { Staff } from '@/features/staff/types';
import {
  useBookingsUIStore,
  selectShowNewBookingModal,
  selectShowShopSettingsModal,
  selectShowStaffScheduleModal,
  selectSelectedDate,
  selectStatusFilter,
  selectViewMode,
  selectSelectedTime,
  selectSelectedStaffId,
} from '../stores/bookingsStore';

// 상수를 모듈 레벨로 호이스팅
const STATUS_COLORS: Readonly<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
  [BookingStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-700',
  [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-700',
} as const;

const STATUS_BADGE_VARIANTS: Readonly<Record<BookingStatus, 'warning' | 'info' | 'success' | 'danger' | 'default'>> = {
  [BookingStatus.PENDING]: 'warning',
  [BookingStatus.CONFIRMED]: 'info',
  [BookingStatus.COMPLETED]: 'success',
  [BookingStatus.CANCELLED]: 'danger',
  [BookingStatus.NO_SHOW]: 'default',
} as const;

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  time: string;
  color: string;
  resourceId: string;
}

export interface CalendarResourceWorkHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface CalendarResource {
  id: string;
  label: string;
  workHours?: CalendarResourceWorkHours[];
}

export interface DesignerOption {
  value: string;
  label: string;
}

interface UseBookingsPageStateReturn {
  // Modal states (from Zustand)
  showNewBookingModal: boolean;
  showShopSettingsModal: boolean;
  showStaffScheduleModal: boolean;
  // View states (from Zustand)
  selectedDate: Date;
  statusFilter: string;
  viewMode: 'calendar' | 'table';
  selectedTime: string;
  selectedStaffId: string;
  // Actions (from Zustand)
  openNewBookingModal: () => void;
  closeNewBookingModal: () => void;
  openShopSettingsModal: () => void;
  closeShopSettingsModal: () => void;
  openStaffScheduleModal: () => void;
  closeStaffScheduleModal: () => void;
  setSelectedDate: (date: Date) => void;
  setStatusFilter: (status: string) => void;
  setViewMode: (mode: 'calendar' | 'table') => void;
  setSelectedTime: (time: string) => void;
  setSelectedStaffId: (staffId: string) => void;
  handleTimeSlotClick: (date: Date, time: string, resourceId?: string) => void;
  // Utilities
  getStatusColor: (status: BookingStatus) => string;
  getStatusBadgeVariant: (status: BookingStatus) => 'warning' | 'info' | 'success' | 'danger' | 'default';
}

export function useBookingsPageState(): UseBookingsPageStateReturn {
  // Zustand state - 개별 셀렉터로 불필요한 리렌더링 방지
  const showNewBookingModal = useBookingsUIStore(selectShowNewBookingModal);
  const showShopSettingsModal = useBookingsUIStore(selectShowShopSettingsModal);
  const showStaffScheduleModal = useBookingsUIStore(selectShowStaffScheduleModal);
  const selectedDate = useBookingsUIStore(selectSelectedDate);
  const statusFilter = useBookingsUIStore(selectStatusFilter);
  const viewMode = useBookingsUIStore(selectViewMode);
  const selectedTime = useBookingsUIStore(selectSelectedTime);
  const selectedStaffId = useBookingsUIStore(selectSelectedStaffId);

  // Zustand actions - useShallow로 안정적 참조 유지
  const actions = useBookingsUIStore(
    useShallow((state) => ({
      openNewBookingModal: state.openNewBookingModal,
      closeNewBookingModal: state.closeNewBookingModal,
      openShopSettingsModal: state.openShopSettingsModal,
      closeShopSettingsModal: state.closeShopSettingsModal,
      openStaffScheduleModal: state.openStaffScheduleModal,
      closeStaffScheduleModal: state.closeStaffScheduleModal,
      setSelectedDate: state.setSelectedDate,
      setStatusFilter: state.setStatusFilter,
      setViewMode: state.setViewMode,
      setSelectedTime: state.setSelectedTime,
      setSelectedStaffId: state.setSelectedStaffId,
      handleTimeSlotClick: state.handleTimeSlotClick,
    }))
  );

  // Status utilities - 모듈 레벨 상수 사용으로 재생성 방지
  const getStatusColor = useCallback((status: BookingStatus): string => {
    return STATUS_COLORS[status];
  }, []);

  const getStatusBadgeVariant = useCallback((status: BookingStatus) => {
    return STATUS_BADGE_VARIANTS[status];
  }, []);

  return useMemo(
    () => ({
      showNewBookingModal,
      showShopSettingsModal,
      showStaffScheduleModal,
      selectedDate,
      statusFilter,
      viewMode,
      selectedTime,
      selectedStaffId,
      ...actions,
      getStatusColor,
      getStatusBadgeVariant,
    }),
    [
      showNewBookingModal,
      showShopSettingsModal,
      showStaffScheduleModal,
      selectedDate,
      statusFilter,
      viewMode,
      selectedTime,
      selectedStaffId,
      actions,
      getStatusColor,
      getStatusBadgeVariant,
    ]
  );
}

// 데이터 변환 유틸리티 (useMemo와 함께 사용)
export function useBookingsData(
  bookings: Booking[],
  staffMembers: Staff[],
  getStatusColor: (status: BookingStatus) => string
) {
  // 예약 가능한 직원 목록 (useMemo로 메모이제이션)
  const designers = useMemo<DesignerOption[]>(() => {
    return staffMembers
      .filter((staff) => staff.isBookingEnabled)
      .map((staff) => ({
        value: staff.id,
        label: staff.name,
      }));
  }, [staffMembers]);

  // 캘린더 리소스 (직원 목록 + 업무 시간)
  const calendarResources = useMemo<CalendarResource[]>(() => {
    return staffMembers
      .filter((staff) => staff.isBookingEnabled)
      .map((staff) => ({
        id: staff.id,
        label: staff.name,
        workHours: staff.workHours?.map((wh) => ({
          dayOfWeek: wh.dayOfWeek,
          openTime: wh.openTime,
          closeTime: wh.closeTime,
          isOpen: wh.isOpen,
        })),
      }));
  }, [staffMembers]);

  // 캘린더 이벤트 변환
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      date: new Date(booking.date),
      title: `${booking.customerName} - ${booking.serviceName}`,
      time: booking.startTime,
      color: getStatusColor(booking.status),
      resourceId: booking.staffId,
    }));
  }, [bookings, getStatusColor]);

  return useMemo(
    () => ({
      designers,
      calendarResources,
      calendarEvents,
    }),
    [designers, calendarResources, calendarEvents]
  );
}
