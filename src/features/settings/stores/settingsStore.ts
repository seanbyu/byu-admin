import { create } from 'zustand';
import { SettingsTab } from '../types';

interface SettingsUIState {
  activeTab: SettingsTab;
  isImageUploading: boolean;
  isVerificationSent: boolean;
}

interface SettingsUIActions {
  setActiveTab: (tab: SettingsTab) => void;
  setImageUploading: (uploading: boolean) => void;
  setVerificationSent: (sent: boolean) => void;
  reset: () => void;
}

type SettingsUIStore = SettingsUIState & { actions: SettingsUIActions };

const initialState: SettingsUIState = {
  activeTab: 'store',
  isImageUploading: false,
  isVerificationSent: false,
};

export const useSettingsUIStore = create<SettingsUIStore>((set) => ({
  ...initialState,
  actions: {
    setActiveTab: (tab) => set({ activeTab: tab }),
    setImageUploading: (uploading) => set({ isImageUploading: uploading }),
    setVerificationSent: (sent) => set({ isVerificationSent: sent }),
    reset: () => set(initialState),
  },
}));

// Selectors
export const selectActiveTab = (state: SettingsUIStore) => state.activeTab;
export const selectIsImageUploading = (state: SettingsUIStore) => state.isImageUploading;
export const selectIsVerificationSent = (state: SettingsUIStore) => state.isVerificationSent;
export const selectSettingsActions = (state: SettingsUIStore) => state.actions;
