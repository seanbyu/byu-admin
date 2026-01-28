import { create } from 'zustand';

/**
 * Salon UI Store
 * - 클라이언트 UI 상태만 관리
 * - 서버 데이터(salon, staff, services)는 TanStack Query로 관리
 */
interface SalonUIState {
  // UI 상태
  selectedStaffId: string | null;
  selectedServiceId: string | null;
  isStaffModalOpen: boolean;
  isServiceModalOpen: boolean;

  // Actions
  setSelectedStaffId: (id: string | null) => void;
  setSelectedServiceId: (id: string | null) => void;
  openStaffModal: () => void;
  closeStaffModal: () => void;
  openServiceModal: () => void;
  closeServiceModal: () => void;
}

export const useSalonStore = create<SalonUIState>((set) => ({
  // UI 상태 초기값
  selectedStaffId: null,
  selectedServiceId: null,
  isStaffModalOpen: false,
  isServiceModalOpen: false,

  // Actions
  setSelectedStaffId: (id) => set({ selectedStaffId: id }),
  setSelectedServiceId: (id) => set({ selectedServiceId: id }),
  openStaffModal: () => set({ isStaffModalOpen: true }),
  closeStaffModal: () => set({ isStaffModalOpen: false }),
  openServiceModal: () => set({ isServiceModalOpen: true }),
  closeServiceModal: () => set({ isServiceModalOpen: false }),
}));
