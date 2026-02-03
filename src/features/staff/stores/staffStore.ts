'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { Staff } from '../types';

// ============================================
// Staff UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리 (모달, 선택된 항목 등)
// ============================================

interface StaffUIState {
  // Modal states
  showInviteModal: boolean;
  selectedStaff: Staff | null;
  editingProfileStaff: Staff | null;
}

interface StaffUIActions {
  // Invite modal
  openInviteModal: () => void;
  closeInviteModal: () => void;

  // Permission modal
  selectStaffForPermission: (staff: Staff) => void;
  clearSelectedStaff: () => void;

  // Profile edit modal
  selectStaffForProfileEdit: (staff: Staff) => void;
  clearEditingProfileStaff: () => void;

  // Reset all
  reset: () => void;
}

type StaffUIStore = StaffUIState & StaffUIActions;

const initialState: StaffUIState = {
  showInviteModal: false,
  selectedStaff: null,
  editingProfileStaff: null,
};

export const useStaffUIStore = create<StaffUIStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Invite modal actions
      openInviteModal: () => set({ showInviteModal: true }, false, 'openInviteModal'),
      closeInviteModal: () => set({ showInviteModal: false }, false, 'closeInviteModal'),

      // Permission modal actions
      selectStaffForPermission: (staff) =>
        set({ selectedStaff: staff }, false, 'selectStaffForPermission'),
      clearSelectedStaff: () =>
        set({ selectedStaff: null }, false, 'clearSelectedStaff'),

      // Profile edit modal actions
      selectStaffForProfileEdit: (staff) =>
        set({ editingProfileStaff: staff }, false, 'selectStaffForProfileEdit'),
      clearEditingProfileStaff: () =>
        set({ editingProfileStaff: null }, false, 'clearEditingProfileStaff'),

      // Reset
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'staff-ui-store' }
  )
);

// ============================================
// Selectors (개별 상태 접근용)
// ============================================

export const selectShowInviteModal = (state: StaffUIStore) => state.showInviteModal;
export const selectSelectedStaff = (state: StaffUIStore) => state.selectedStaff;
export const selectEditingProfileStaff = (state: StaffUIStore) => state.editingProfileStaff;

// Actions selector
export const selectStaffUIActions = (state: StaffUIStore): StaffUIActions => ({
  openInviteModal: state.openInviteModal,
  closeInviteModal: state.closeInviteModal,
  selectStaffForPermission: state.selectStaffForPermission,
  clearSelectedStaff: state.clearSelectedStaff,
  selectStaffForProfileEdit: state.selectStaffForProfileEdit,
  clearEditingProfileStaff: state.clearEditingProfileStaff,
  reset: state.reset,
});

// ============================================
// Optimized Hooks (useShallow로 불필요한 리렌더링 방지)
// ============================================

/**
 * 모달 상태만 구독하는 훅
 * @example const { showInviteModal, selectedStaff } = useStaffModals();
 */
export function useStaffModals() {
  return useStaffUIStore(
    useShallow((state) => ({
      showInviteModal: state.showInviteModal,
      selectedStaff: state.selectedStaff,
      editingProfileStaff: state.editingProfileStaff,
    }))
  );
}

/**
 * 액션만 구독하는 훅 (상태 변경 시 리렌더링 안됨)
 * @example const { openInviteModal, closeInviteModal } = useStaffUIActions();
 */
export function useStaffUIActions() {
  return useStaffUIStore(
    useShallow((state) => ({
      openInviteModal: state.openInviteModal,
      closeInviteModal: state.closeInviteModal,
      selectStaffForPermission: state.selectStaffForPermission,
      clearSelectedStaff: state.clearSelectedStaff,
      selectStaffForProfileEdit: state.selectStaffForProfileEdit,
      clearEditingProfileStaff: state.clearEditingProfileStaff,
      reset: state.reset,
    }))
  );
}

/**
 * 특정 모달의 열림 상태만 구독
 */
export function useInviteModalOpen() {
  return useStaffUIStore(selectShowInviteModal);
}

export function usePermissionModalStaff() {
  return useStaffUIStore(selectSelectedStaff);
}

export function useProfileModalStaff() {
  return useStaffUIStore(selectEditingProfileStaff);
}
