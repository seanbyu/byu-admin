'use client';

import { create } from 'zustand';

// ============================================
// UI State Store - 순수 UI 상태만 관리
// (탭 상태는 URL로 관리됨)
// ============================================

interface SettingsUIState {
  // Phone verification
  isVerificationSent: boolean;
  isPhoneVerified: boolean;

  // Store info editing states
  editingField: 'name' | 'address' | 'instagram' | null;
  tempValue: string;
}

interface SettingsUIActions {
  // Verification
  setVerificationSent: (sent: boolean) => void;
  setPhoneVerified: (verified: boolean) => void;

  // Field editing - 단일 함수로 통합
  startEditing: (field: 'name' | 'address' | 'instagram', initialValue: string) => void;
  updateTempValue: (value: string) => void;
  cancelEditing: () => void;
  finishEditing: () => void;

  // Reset
  reset: () => void;
}

type SettingsUIStore = SettingsUIState & { actions: SettingsUIActions };

const initialState: SettingsUIState = {
  isVerificationSent: false,
  isPhoneVerified: false,
  editingField: null,
  tempValue: '',
};

export const useSettingsUIStore = create<SettingsUIStore>((set) => ({
  ...initialState,
  actions: {
    setVerificationSent: (sent) => set({ isVerificationSent: sent }),

    setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),

    startEditing: (field, initialValue) => set({
      editingField: field,
      tempValue: initialValue
    }),

    updateTempValue: (value) => set({ tempValue: value }),

    cancelEditing: () => set({ editingField: null, tempValue: '' }),

    finishEditing: () => set({ editingField: null, tempValue: '' }),

    reset: () => set(initialState),
  },
}));

// ============================================
// Selectors - 메모이제이션을 위한 단순 selector
// ============================================

export const selectIsVerificationSent = (state: SettingsUIStore) => state.isVerificationSent;
export const selectIsPhoneVerified = (state: SettingsUIStore) => state.isPhoneVerified;
export const selectEditingField = (state: SettingsUIStore) => state.editingField;
export const selectTempValue = (state: SettingsUIStore) => state.tempValue;
export const selectSettingsActions = (state: SettingsUIStore) => state.actions;

// Derived selectors
export const selectIsEditingName = (state: SettingsUIStore) => state.editingField === 'name';
export const selectIsEditingAddress = (state: SettingsUIStore) => state.editingField === 'address';
export const selectIsEditingInstagram = (state: SettingsUIStore) => state.editingField === 'instagram';
