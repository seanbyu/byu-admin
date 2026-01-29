'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================
// Salon Menus UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리
// ============================================

interface SalonMenusUIState {
  // View states
  selectedTab: string;
  showReorderSettings: boolean;
  showIndustryModal: boolean;

  // Actions
  setSelectedTab: (tab: string) => void;
  toggleReorderSettings: () => void;
  openIndustryModal: () => void;
  closeIndustryModal: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  selectedTab: 'all',
  showReorderSettings: false,
  showIndustryModal: false,
};

export const useSalonMenusUIStore = create<SalonMenusUIState>()(
  devtools(
    (set) => ({
      ...initialState,

      setSelectedTab: (tab) =>
        set({ selectedTab: tab }, false, 'setSelectedTab'),

      toggleReorderSettings: () =>
        set(
          (state) => ({ showReorderSettings: !state.showReorderSettings }),
          false,
          'toggleReorderSettings'
        ),

      openIndustryModal: () =>
        set({ showIndustryModal: true }, false, 'openIndustryModal'),

      closeIndustryModal: () =>
        set({ showIndustryModal: false }, false, 'closeIndustryModal'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'salon-menus-ui-store' }
  )
);

// ============================================
// Selectors
// ============================================
export const selectSelectedTab = (state: SalonMenusUIState) => state.selectedTab;
export const selectShowReorderSettings = (state: SalonMenusUIState) => state.showReorderSettings;
export const selectShowIndustryModal = (state: SalonMenusUIState) => state.showIndustryModal;

export const selectSalonMenusUIActions = (state: SalonMenusUIState) => ({
  setSelectedTab: state.setSelectedTab,
  toggleReorderSettings: state.toggleReorderSettings,
  openIndustryModal: state.openIndustryModal,
  closeIndustryModal: state.closeIndustryModal,
  reset: state.reset,
});
