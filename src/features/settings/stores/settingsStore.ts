'use client';

import { create } from 'zustand';
import { SettingsTab } from '../types';

// ============================================
// UI State Store - 순수 UI 상태만 관리
// ============================================

interface SettingsUIState {
  // Tab state
  activeTab: SettingsTab;

  // Phone verification
  isVerificationSent: boolean;

  // Store info editing states
  editingField: 'name' | 'address' | 'instagram' | null;
  tempValue: string;
}

interface SettingsUIActions {
  // Tab
  setActiveTab: (tab: SettingsTab) => void;

  // Verification
  setVerificationSent: (sent: boolean) => void;

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
  activeTab: 'store',
  isVerificationSent: false,
  editingField: null,
  tempValue: '',
};

export const useSettingsUIStore = create<SettingsUIStore>((set) => ({
  ...initialState,
  actions: {
    setActiveTab: (tab) => set({ activeTab: tab }),

    setVerificationSent: (sent) => set({ isVerificationSent: sent }),

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

export const selectActiveTab = (state: SettingsUIStore) => state.activeTab;
export const selectIsVerificationSent = (state: SettingsUIStore) => state.isVerificationSent;
export const selectEditingField = (state: SettingsUIStore) => state.editingField;
export const selectTempValue = (state: SettingsUIStore) => state.tempValue;
export const selectSettingsActions = (state: SettingsUIStore) => state.actions;

// Derived selectors
export const selectIsEditingName = (state: SettingsUIStore) => state.editingField === 'name';
export const selectIsEditingAddress = (state: SettingsUIStore) => state.editingField === 'address';
export const selectIsEditingInstagram = (state: SettingsUIStore) => state.editingField === 'instagram';
