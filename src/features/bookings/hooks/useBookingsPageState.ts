'use client';

import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { Staff } from '@/features/staff/types';
import {
  useBookingsUIStore,
  selectShowNewBookingModal,
  selectShowBookingDetailModal,
  selectSelectedBooking,
  selectShowShopSettingsModal,
  selectShowStaffScheduleModal,
  selectSelectedDate,
  selectStatusFilter,
  selectSelectedTime,
  selectSelectedStaffId,
  selectSelectedServiceId,
  selectHighlightedBookingId,
} from '../stores/bookingsStore';

// 상수를 모듈 레벨로 호이스팅
const STATUS_COLORS: Readonly<Record<BookingStatus, string>> = {
  [BookingStatus.PENDING]: 'bg-warning-100 text-warning-700',
  [BookingStatus.CONFIRMED]: 'bg-info-100 text-info-700',
  [BookingStatus.IN_PROGRESS]: 'bg-primary-100 text-primary-700',
  [BookingStatus.COMPLETED]: 'bg-success-100 text-success-700',
  [BookingStatus.CANCELLED]: 'bg-error-100 text-error-700',
  [BookingStatus.NO_SHOW]: 'bg-secondary-100 text-secondary-700',
} as const;

export interface ArtistOption {
  value: string;
  label: string;
}

interface UseBookingsPageStateReturn {
  // Modal states
  showNewBookingModal: boolean;
  showBookingDetailModal: boolean;
  selectedBooking: Booking | null;
  showShopSettingsModal: boolean;
  showStaffScheduleModal: boolean;
  // View states
  selectedDate: Date;
  statusFilter: string;
  selectedTime: string;
  selectedStaffId: string;
  selectedServiceId: string;
  highlightedBookingId: string | null;
  // Actions
  openNewBookingModal: () => void;
  closeNewBookingModal: () => void;
  openBookingDetailModal: (booking: Booking) => void;
  closeBookingDetailModal: () => void;
  openShopSettingsModal: () => void;
  closeShopSettingsModal: () => void;
  openStaffScheduleModal: () => void;
  closeStaffScheduleModal: () => void;
  setSelectedDate: (date: Date) => void;
  setStatusFilter: (status: string) => void;
  setSelectedTime: (time: string) => void;
  setSelectedStaffId: (staffId: string) => void;
  setSelectedServiceId: (serviceId: string) => void;
  setHighlightedBookingId: (id: string | null) => void;
  // Utilities
  getStatusColor: (status: BookingStatus) => string;
}

export function useBookingsPageState(): UseBookingsPageStateReturn {
  const showNewBookingModal = useBookingsUIStore(selectShowNewBookingModal);
  const showBookingDetailModal = useBookingsUIStore(selectShowBookingDetailModal);
  const selectedBooking = useBookingsUIStore(selectSelectedBooking);
  const showShopSettingsModal = useBookingsUIStore(selectShowShopSettingsModal);
  const showStaffScheduleModal = useBookingsUIStore(selectShowStaffScheduleModal);
  const selectedDate = useBookingsUIStore(selectSelectedDate);
  const statusFilter = useBookingsUIStore(selectStatusFilter);
  const selectedTime = useBookingsUIStore(selectSelectedTime);
  const selectedStaffId = useBookingsUIStore(selectSelectedStaffId);
  const selectedServiceId = useBookingsUIStore(selectSelectedServiceId);
  const highlightedBookingId = useBookingsUIStore(selectHighlightedBookingId);

  const actions = useBookingsUIStore(
    useShallow((state) => ({
      openNewBookingModal: state.openNewBookingModal,
      closeNewBookingModal: state.closeNewBookingModal,
      openBookingDetailModal: state.openBookingDetailModal,
      closeBookingDetailModal: state.closeBookingDetailModal,
      openShopSettingsModal: state.openShopSettingsModal,
      closeShopSettingsModal: state.closeShopSettingsModal,
      openStaffScheduleModal: state.openStaffScheduleModal,
      closeStaffScheduleModal: state.closeStaffScheduleModal,
      setSelectedDate: state.setSelectedDate,
      setStatusFilter: state.setStatusFilter,
      setSelectedTime: state.setSelectedTime,
      setSelectedStaffId: state.setSelectedStaffId,
      setSelectedServiceId: state.setSelectedServiceId,
      setHighlightedBookingId: state.setHighlightedBookingId,
    }))
  );

  const getStatusColor = useCallback((status: BookingStatus): string => {
    return STATUS_COLORS[status];
  }, []);

  return useMemo(
    () => ({
      showNewBookingModal,
      showBookingDetailModal,
      selectedBooking,
      showShopSettingsModal,
      showStaffScheduleModal,
      selectedDate,
      statusFilter,
      selectedTime,
      selectedStaffId,
      selectedServiceId,
      highlightedBookingId,
      ...actions,
      getStatusColor,
    }),
    [
      showNewBookingModal,
      showBookingDetailModal,
      selectedBooking,
      showShopSettingsModal,
      showStaffScheduleModal,
      selectedDate,
      statusFilter,
      selectedTime,
      selectedStaffId,
      selectedServiceId,
      highlightedBookingId,
      actions,
      getStatusColor,
    ]
  );
}

// 데이터 변환 유틸리티
export function useBookingsData(
  _bookings: Booking[],
  staffMembers: Staff[],
  _getStatusColor: (status: BookingStatus) => string
) {
  const artists = useMemo<ArtistOption[]>(() => {
    return staffMembers
      .filter((staff) => staff.isBookingEnabled)
      .map((staff) => ({
        value: staff.id,
        label: staff.name,
      }));
  }, [staffMembers]);

  return useMemo(() => ({ artists }), [artists]);
}
