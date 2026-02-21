'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Booking } from '../types';

// ============================================
// Bookings UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리
// ============================================

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
  setSelectedTime: (time: string) => void;
  setSelectedStaffId: (staffId: string) => void;
  setSelectedServiceId: (serviceId: string) => void;

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
  selectedTime: '',
  selectedStaffId: '',
  selectedServiceId: '',
};

export const useBookingsUIStore = create<BookingsUIState>()(
  devtools(
    (set) => ({
      ...initialState,

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

      setSelectedDate: (date) =>
        set({ selectedDate: date }, false, 'setSelectedDate'),

      setStatusFilter: (status) =>
        set({ statusFilter: status }, false, 'setStatusFilter'),

      setSelectedTime: (time) =>
        set({ selectedTime: time }, false, 'setSelectedTime'),

      setSelectedStaffId: (staffId) =>
        set({ selectedStaffId: staffId }, false, 'setSelectedStaffId'),

      setSelectedServiceId: (serviceId) =>
        set({ selectedServiceId: serviceId }, false, 'setSelectedServiceId'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'bookings-ui-store' }
  )
);

// ============================================
// Selectors
// ============================================
export const selectShowNewBookingModal = (state: BookingsUIState) => state.showNewBookingModal;
export const selectShowBookingDetailModal = (state: BookingsUIState) => state.showBookingDetailModal;
export const selectSelectedBooking = (state: BookingsUIState) => state.selectedBooking;
export const selectShowShopSettingsModal = (state: BookingsUIState) => state.showShopSettingsModal;
export const selectShowStaffScheduleModal = (state: BookingsUIState) => state.showStaffScheduleModal;
export const selectSelectedDate = (state: BookingsUIState) => state.selectedDate;
export const selectStatusFilter = (state: BookingsUIState) => state.statusFilter;
export const selectSelectedTime = (state: BookingsUIState) => state.selectedTime;
export const selectSelectedStaffId = (state: BookingsUIState) => state.selectedStaffId;
export const selectSelectedServiceId = (state: BookingsUIState) => state.selectedServiceId;
