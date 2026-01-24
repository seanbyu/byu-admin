import { create } from 'zustand';
import { Locale } from '@/types';

interface UIState {
  isSidebarOpen: boolean;
  locale: Locale;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setLocale: (locale: Locale) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  locale: 'ko',
  isModalOpen: false,
  modalContent: null,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  setLocale: (locale) => set({ locale }),

  openModal: (content) =>
    set({
      isModalOpen: true,
      modalContent: content,
    }),

  closeModal: () =>
    set({
      isModalOpen: false,
      modalContent: null,
    }),
}));
