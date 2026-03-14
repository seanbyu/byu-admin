'use client';

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { Booking } from '../types';

// ============================================
// Bookings UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리
// - selectedStaffIds는 localStorage에 persist → 새로고침 후에도 유지
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
  selectedStaffId: string;       // 새 예약 모달 pre-fill 용
  selectedStaffIds: string[];    // 담당자 필터 멀티 선택 (빈 배열 = 전체) — persisted
  selectedServiceId: string;
  highlightedBookingId: string | null;

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
  setSelectedStaffIds: (staffIds: string[]) => void;
  setSelectedServiceId: (serviceId: string) => void;
  setHighlightedBookingId: (id: string | null) => void;

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
  selectedStaffIds: [] as string[],
  selectedServiceId: '',
  highlightedBookingId: null as string | null,
};

export const useBookingsUIStore = create<BookingsUIState>()(
  devtools(
    persist(
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

        setSelectedStaffIds: (staffIds) =>
          set({ selectedStaffIds: staffIds }, false, 'setSelectedStaffIds'),

        setSelectedServiceId: (serviceId) =>
          set({ selectedServiceId: serviceId }, false, 'setSelectedServiceId'),

        setHighlightedBookingId: (id) =>
          set({ highlightedBookingId: id }, false, 'setHighlightedBookingId'),

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'byu-bookings-staff-filter',
        storage: createJSONStorage(() => localStorage),
        // selectedStaffIds만 localStorage에 저장 — 나머지 UI 상태는 휘발성
        partialize: (state) => ({ selectedStaffIds: state.selectedStaffIds }),
      }
    ),
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
export const selectSelectedStaffIds = (state: BookingsUIState) => state.selectedStaffIds;
export const selectSelectedServiceId = (state: BookingsUIState) => state.selectedServiceId;
export const selectHighlightedBookingId = (state: BookingsUIState) => state.highlightedBookingId;
