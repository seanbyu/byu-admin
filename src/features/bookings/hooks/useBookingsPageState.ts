'use client';

import { useState, useCallback, useMemo } from 'react';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { Staff } from '@/features/staff/types';

// 상수를 컴포넌트 외부로 호이스팅 (rendering-hoist-jsx)
const STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
  [BookingStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-700',
  [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-700',
};

const STATUS_BADGE_VARIANTS: Record<BookingStatus, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
  [BookingStatus.PENDING]: 'warning',
  [BookingStatus.CONFIRMED]: 'info',
  [BookingStatus.COMPLETED]: 'success',
  [BookingStatus.CANCELLED]: 'danger',
  [BookingStatus.NO_SHOW]: 'default',
};

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  time: string;
  color: string;
  resourceId: string;
}

export interface CalendarResource {
  id: string;
  label: string;
}

export interface DesignerOption {
  value: string;
  label: string;
}

interface UseBookingsPageStateReturn {
  // Modal states
  showNewBookingModal: boolean;
  showShopSettingsModal: boolean;
  showStaffScheduleModal: boolean;
  // View states
  selectedDate: Date;
  statusFilter: string;
  viewMode: 'calendar' | 'table';
  selectedTime: string;
  selectedStaffId: string;
  // Actions
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
  // Modal states
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showShopSettingsModal, setShowShopSettingsModal] = useState(false);
  const [showStaffScheduleModal, setShowStaffScheduleModal] = useState(false);

  // View states
  const [selectedDate, setSelectedDate] = useState(() => new Date()); // rerender-lazy-state-init
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // Modal actions - useCallback으로 안정적인 참조 유지 (rerender-functional-setstate)
  const openNewBookingModal = useCallback(() => {
    setShowNewBookingModal(true);
  }, []);

  const closeNewBookingModal = useCallback(() => {
    setShowNewBookingModal(false);
    setSelectedTime('');
    setSelectedStaffId('');
  }, []);

  const openShopSettingsModal = useCallback(() => {
    setShowShopSettingsModal(true);
  }, []);

  const closeShopSettingsModal = useCallback(() => {
    setShowShopSettingsModal(false);
  }, []);

  const openStaffScheduleModal = useCallback(() => {
    setShowStaffScheduleModal(true);
  }, []);

  const closeStaffScheduleModal = useCallback(() => {
    setShowStaffScheduleModal(false);
  }, []);

  // Time slot click handler
  const handleTimeSlotClick = useCallback((date: Date, time: string, resourceId?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (resourceId) {
      setSelectedStaffId(resourceId);
    }
    setShowNewBookingModal(true);
  }, []);

  // Status utilities - 컴포넌트 외부 상수 사용으로 재생성 방지
  const getStatusColor = useCallback((status: BookingStatus): string => {
    return STATUS_COLORS[status];
  }, []);

  const getStatusBadgeVariant = useCallback((status: BookingStatus) => {
    return STATUS_BADGE_VARIANTS[status];
  }, []);

  return {
    // Modal states
    showNewBookingModal,
    showShopSettingsModal,
    showStaffScheduleModal,
    // View states
    selectedDate,
    statusFilter,
    viewMode,
    selectedTime,
    selectedStaffId,
    // Actions
    openNewBookingModal,
    closeNewBookingModal,
    openShopSettingsModal,
    closeShopSettingsModal,
    openStaffScheduleModal,
    closeStaffScheduleModal,
    setSelectedDate,
    setStatusFilter,
    setViewMode,
    setSelectedTime,
    setSelectedStaffId,
    handleTimeSlotClick,
    // Utilities
    getStatusColor,
    getStatusBadgeVariant,
  };
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

  // 캘린더 리소스 (직원 목록)
  const calendarResources = useMemo<CalendarResource[]>(() => {
    return staffMembers
      .filter((staff) => staff.isBookingEnabled)
      .map((staff) => ({
        id: staff.id,
        label: staff.name,
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

  return {
    designers,
    calendarResources,
    calendarEvents,
  };
}
