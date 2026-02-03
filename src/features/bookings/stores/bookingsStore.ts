'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Booking } from '../types';

// ============================================
// Bookings UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리
// ============================================

type ViewMode = 'calendar' | 'table';

interface BookingsUIState {
  // Modal states
  showNewBookingModal: boolean;
  showBookingDetailModal: boolean;
  showShopSettingsModal: boolean;
  showStaffScheduleModal: boolean;

  // Selected booking for edit
  selectedBooking: Booking | null;

  // View states
  selectedDate: Date;
  statusFilter: string;
  viewMode: ViewMode;
  selectedTime: string;
  selectedStaffId: string;
  selectedServiceId: string;

  // Modal actions
  openNewBookingModal: () => void;
  closeNewBookingModal: () => void;
  openBookingDetailModal: (booking: Booking) => void;
  closeBookingDetailModal: () => void;
  openShopSettingsModal: () => void;
  closeShopSettingsModal: () => void;
  openStaffScheduleModal: () => void;
  closeStaffScheduleModal: () => void;

  // View actions
  setSelectedDate: (date: Date) => void;
  setStatusFilter: (status: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedTime: (time: string) => void;
  setSelectedStaffId: (staffId: string) => void;
  setSelectedServiceId: (serviceId: string) => void;

  // Combined action
  handleTimeSlotClick: (date: Date, time: string, resourceId?: string) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  showNewBookingModal: false,
  showBookingDetailModal: false,
  showShopSettingsModal: false,
  showStaffScheduleModal: false,
  selectedBooking: null as Booking | null,
  selectedDate: new Date(),
  statusFilter: '',
  viewMode: 'calendar' as ViewMode,
  selectedTime: '',
  selectedStaffId: '',
  selectedServiceId: '',
};

export const useBookingsUIStore = create<BookingsUIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Modal actions
      openNewBookingModal: () =>
        set({ showNewBookingModal: true }, false, 'openNewBookingModal'),

      closeNewBookingModal: () =>
        set(
          { showNewBookingModal: false, selectedTime: '', selectedStaffId: '', selectedServiceId: '' },
          false,
          'closeNewBookingModal'
        ),

      openBookingDetailModal: (booking: Booking) =>
        set({ showBookingDetailModal: true, selectedBooking: booking }, false, 'openBookingDetailModal'),

      closeBookingDetailModal: () =>
        set({ showBookingDetailModal: false, selectedBooking: null }, false, 'closeBookingDetailModal'),

      openShopSettingsModal: () =>
        set({ showShopSettingsModal: true }, false, 'openShopSettingsModal'),

      closeShopSettingsModal: () =>
        set({ showShopSettingsModal: false }, false, 'closeShopSettingsModal'),

      openStaffScheduleModal: () =>
        set({ showStaffScheduleModal: true }, false, 'openStaffScheduleModal'),

      closeStaffScheduleModal: () =>
        set({ showStaffScheduleModal: false }, false, 'closeStaffScheduleModal'),

      // View actions
      setSelectedDate: (date) =>
        set({ selectedDate: date }, false, 'setSelectedDate'),

      setStatusFilter: (status) =>
        set({ statusFilter: status }, false, 'setStatusFilter'),

      setViewMode: (mode) =>
        set({ viewMode: mode }, false, 'setViewMode'),

      setSelectedTime: (time) =>
        set({ selectedTime: time }, false, 'setSelectedTime'),

      setSelectedStaffId: (staffId) =>
        set({ selectedStaffId: staffId }, false, 'setSelectedStaffId'),

      setSelectedServiceId: (serviceId) =>
        set({ selectedServiceId: serviceId }, false, 'setSelectedServiceId'),

      // Combined action for time slot click
      handleTimeSlotClick: (date, time, resourceId) =>
        set(
          {
            selectedDate: date,
            selectedTime: time,
            selectedStaffId: resourceId || '',
            showNewBookingModal: true,
          },
          false,
          'handleTimeSlotClick'
        ),

      // Reset all state
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'bookings-ui-store' }
  )
);

// ============================================
// Selectors (메모이제이션을 위한 셀렉터)
// ============================================
export const selectShowNewBookingModal = (state: BookingsUIState) => state.showNewBookingModal;
export const selectShowBookingDetailModal = (state: BookingsUIState) => state.showBookingDetailModal;
export const selectSelectedBooking = (state: BookingsUIState) => state.selectedBooking;
export const selectShowShopSettingsModal = (state: BookingsUIState) => state.showShopSettingsModal;
export const selectShowStaffScheduleModal = (state: BookingsUIState) => state.showStaffScheduleModal;
export const selectSelectedDate = (state: BookingsUIState) => state.selectedDate;
export const selectStatusFilter = (state: BookingsUIState) => state.statusFilter;
export const selectViewMode = (state: BookingsUIState) => state.viewMode;
export const selectSelectedTime = (state: BookingsUIState) => state.selectedTime;
export const selectSelectedStaffId = (state: BookingsUIState) => state.selectedStaffId;
export const selectSelectedServiceId = (state: BookingsUIState) => state.selectedServiceId;

// Actions selector
export const selectBookingsUIActions = (state: BookingsUIState) => ({
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
  setViewMode: state.setViewMode,
  setSelectedTime: state.setSelectedTime,
  setSelectedStaffId: state.setSelectedStaffId,
  setSelectedServiceId: state.setSelectedServiceId,
  handleTimeSlotClick: state.handleTimeSlotClick,
  reset: state.reset,
});
