'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Staff } from '../types';

// ============================================
// Staff UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리
// ============================================

interface StaffUIState {
  // Modal states
  showInviteModal: boolean;
  selectedStaff: Staff | null;
  editingProfileStaff: Staff | null;

  // Actions
  openInviteModal: () => void;
  closeInviteModal: () => void;
  selectStaffForPermission: (staff: Staff) => void;
  clearSelectedStaff: () => void;
  selectStaffForProfileEdit: (staff: Staff) => void;
  clearEditingProfileStaff: () => void;
  reset: () => void;
}

const initialState = {
  showInviteModal: false,
  selectedStaff: null,
  editingProfileStaff: null,
};

export const useStaffUIStore = create<StaffUIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Modal actions
      openInviteModal: () => set({ showInviteModal: true }, false, 'openInviteModal'),
      closeInviteModal: () => set({ showInviteModal: false }, false, 'closeInviteModal'),

      // Permission modal
      selectStaffForPermission: (staff) =>
        set({ selectedStaff: staff }, false, 'selectStaffForPermission'),
      clearSelectedStaff: () =>
        set({ selectedStaff: null }, false, 'clearSelectedStaff'),

      // Profile edit modal
      selectStaffForProfileEdit: (staff) =>
        set({ editingProfileStaff: staff }, false, 'selectStaffForProfileEdit'),
      clearEditingProfileStaff: () =>
        set({ editingProfileStaff: null }, false, 'clearEditingProfileStaff'),

      // Reset all state
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'staff-ui-store' }
  )
);

// ============================================
// Selectors (메모이제이션을 위한 셀렉터)
// ============================================
export const selectShowInviteModal = (state: StaffUIState) => state.showInviteModal;
export const selectSelectedStaff = (state: StaffUIState) => state.selectedStaff;
export const selectEditingProfileStaff = (state: StaffUIState) => state.editingProfileStaff;

// Actions selector (컴포넌트에서 actions만 가져올 때 사용)
export const selectStaffUIActions = (state: StaffUIState) => ({
  openInviteModal: state.openInviteModal,
  closeInviteModal: state.closeInviteModal,
  selectStaffForPermission: state.selectStaffForPermission,
  clearSelectedStaff: state.clearSelectedStaff,
  selectStaffForProfileEdit: state.selectStaffForProfileEdit,
  clearEditingProfileStaff: state.clearEditingProfileStaff,
  reset: state.reset,
});
