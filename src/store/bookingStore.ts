import { create } from 'zustand';

/**
 * Booking UI Store
 * - 클라이언트 UI 상태만 관리
 * - 서버 데이터(bookings)는 TanStack Query로 관리 (useBookings hook)
 */
interface BookingUIState {
  // UI 상태
  selectedDate: Date;
  selectedStaffId: string | null;
  isNewBookingModalOpen: boolean;

  // Actions
  setSelectedDate: (date: Date) => void;
  setSelectedStaffId: (staffId: string | null) => void;
  openNewBookingModal: () => void;
  closeNewBookingModal: () => void;
}

export const useBookingStore = create<BookingUIState>((set) => ({
  // UI 상태 초기값
  selectedDate: new Date(),
  selectedStaffId: null,
  isNewBookingModalOpen: false,

  // Actions
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedStaffId: (staffId) => set({ selectedStaffId: staffId }),
  openNewBookingModal: () => set({ isNewBookingModalOpen: true }),
  closeNewBookingModal: () => set({ isNewBookingModalOpen: false }),
}));
