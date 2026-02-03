'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BusinessHours, Holiday } from '@/types';
import { SupportedLanguage } from '../constants';
import { getDefaultBusinessHours, getTodayString } from '../utils';
import { ContactChannels } from '../hooks/useSalonSettings';

// ============================================
// Settings Form State Store (Zustand)
// - Form state for editing settings
// - Separates UI form state from server state
// ============================================

interface SettingsFormState {
  // Business Settings Form
  businessHours: BusinessHours[];
  slotDuration: number;
  bookingAdvanceDays: number;

  // Holiday Form
  holidays: Holiday[];
  newHoliday: {
    startDate: string;
    endDate: string;
    reason: string;
  };

  // Interpreter Settings Form
  interpreterEnabled: boolean;
  supportedLanguages: SupportedLanguage[];

  // Contact Channels Form
  contactChannels: ContactChannels;

  // Form status
  isDirty: boolean;

  // Actions
  setBusinessHours: (hours: BusinessHours[]) => void;
  toggleDayOpen: (dayOfWeek: number) => void;
  setDayTime: (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => void;
  setSlotDuration: (duration: number) => void;
  setBookingAdvanceDays: (days: number) => void;

  setHolidays: (holidays: Holiday[]) => void;
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (id: string) => void;
  setNewHolidayField: (field: string, value: string) => void;
  resetNewHoliday: () => void;

  setInterpreterEnabled: (enabled: boolean) => void;
  toggleInterpreterEnabled: () => void;
  setSupportedLanguages: (languages: SupportedLanguage[]) => void;
  toggleLanguage: (language: SupportedLanguage) => void;

  // Contact Channels Actions
  setContactChannels: (channels: ContactChannels) => void;
  toggleContactChannel: (channel: 'line' | 'instagram') => void;
  setContactChannelId: (channel: 'line' | 'instagram', id: string) => void;

  // Initialize from server data
  initializeFromServer: (data: {
    businessHours?: BusinessHours[];
    holidays?: Holiday[];
    settings?: {
      slot_duration_minutes?: number;
      booking_advance_days?: number;
      interpreter_enabled?: boolean;
      supported_languages?: SupportedLanguage[];
      contact_channels?: ContactChannels;
    };
  }) => void;

  // Reset
  reset: () => void;
  markClean: () => void;
}

const initialNewHoliday = {
  startDate: getTodayString(),
  endDate: '',
  reason: '',
};

const initialContactChannels: ContactChannels = {
  line: { enabled: false, id: '' },
  instagram: { enabled: false, id: '' },
};

const initialState = {
  businessHours: getDefaultBusinessHours(),
  slotDuration: 30,
  bookingAdvanceDays: 30,
  holidays: [] as Holiday[],
  newHoliday: initialNewHoliday,
  interpreterEnabled: false,
  supportedLanguages: [] as SupportedLanguage[],
  contactChannels: initialContactChannels,
  isDirty: false,
};

export const useSettingsFormStore = create<SettingsFormState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Business Hours Actions
      setBusinessHours: (hours) =>
        set({ businessHours: hours, isDirty: true }, false, 'setBusinessHours'),

      toggleDayOpen: (dayOfWeek) =>
        set(
          (state) => ({
            businessHours: state.businessHours.map((bh) =>
              bh.dayOfWeek === dayOfWeek ? { ...bh, isOpen: !bh.isOpen } : bh
            ),
            isDirty: true,
          }),
          false,
          'toggleDayOpen'
        ),

      setDayTime: (dayOfWeek, field, value) =>
        set(
          (state) => ({
            businessHours: state.businessHours.map((bh) =>
              bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh
            ),
            isDirty: true,
          }),
          false,
          'setDayTime'
        ),

      setSlotDuration: (duration) =>
        set({ slotDuration: duration, isDirty: true }, false, 'setSlotDuration'),

      setBookingAdvanceDays: (days) =>
        set({ bookingAdvanceDays: days, isDirty: true }, false, 'setBookingAdvanceDays'),

      // Holiday Actions
      setHolidays: (holidays) =>
        set({ holidays, isDirty: true }, false, 'setHolidays'),

      addHoliday: (holiday) =>
        set(
          (state) => ({
            holidays: [...state.holidays, holiday],
            newHoliday: initialNewHoliday,
            isDirty: true,
          }),
          false,
          'addHoliday'
        ),

      removeHoliday: (id) =>
        set(
          (state) => ({
            holidays: state.holidays.filter((h) => h.id !== id),
            isDirty: true,
          }),
          false,
          'removeHoliday'
        ),

      setNewHolidayField: (field, value) =>
        set(
          (state) => ({
            newHoliday: { ...state.newHoliday, [field]: value },
          }),
          false,
          'setNewHolidayField'
        ),

      resetNewHoliday: () =>
        set({ newHoliday: initialNewHoliday }, false, 'resetNewHoliday'),

      // Interpreter Actions
      setInterpreterEnabled: (enabled) =>
        set({ interpreterEnabled: enabled, isDirty: true }, false, 'setInterpreterEnabled'),

      toggleInterpreterEnabled: () =>
        set(
          (state) => {
            const newEnabled = !state.interpreterEnabled;
            // 토글 ON 시 선택된 언어가 없으면 영어를 기본으로 선택
            const newLanguages =
              newEnabled && state.supportedLanguages.length === 0
                ? ['en' as SupportedLanguage]
                : state.supportedLanguages;
            return {
              interpreterEnabled: newEnabled,
              supportedLanguages: newLanguages,
              isDirty: true,
            };
          },
          false,
          'toggleInterpreterEnabled'
        ),

      setSupportedLanguages: (languages) =>
        set({ supportedLanguages: languages, isDirty: true }, false, 'setSupportedLanguages'),

      toggleLanguage: (language) =>
        set(
          (state) => {
            const isSelected = state.supportedLanguages.includes(language);
            // 통역 서비스가 활성화되어 있고, 마지막 언어를 해제하려는 경우 방지
            if (isSelected && state.interpreterEnabled && state.supportedLanguages.length === 1) {
              return state; // 변경 없이 현재 상태 유지
            }
            return {
              supportedLanguages: isSelected
                ? state.supportedLanguages.filter((l) => l !== language)
                : [...state.supportedLanguages, language],
              isDirty: true,
            };
          },
          false,
          'toggleLanguage'
        ),

      // Contact Channels Actions
      setContactChannels: (channels) =>
        set({ contactChannels: channels, isDirty: true }, false, 'setContactChannels'),

      toggleContactChannel: (channel) =>
        set(
          (state) => ({
            contactChannels: {
              ...state.contactChannels,
              [channel]: {
                ...state.contactChannels[channel],
                enabled: !state.contactChannels[channel]?.enabled,
              },
            },
            isDirty: true,
          }),
          false,
          'toggleContactChannel'
        ),

      setContactChannelId: (channel, id) =>
        set(
          (state) => ({
            contactChannels: {
              ...state.contactChannels,
              [channel]: {
                ...state.contactChannels[channel],
                id,
              },
            },
            isDirty: true,
          }),
          false,
          'setContactChannelId'
        ),

      // Initialize from server data
      initializeFromServer: (data) =>
        set(
          {
            businessHours: data.businessHours?.length ? data.businessHours : getDefaultBusinessHours(),
            holidays: data.holidays || [],
            slotDuration: data.settings?.slot_duration_minutes || 30,
            bookingAdvanceDays: data.settings?.booking_advance_days || 30,
            interpreterEnabled: data.settings?.interpreter_enabled || false,
            supportedLanguages: (data.settings?.supported_languages as SupportedLanguage[]) || [],
            contactChannels: data.settings?.contact_channels || initialContactChannels,
            isDirty: false,
          },
          false,
          'initializeFromServer'
        ),

      // Reset to initial state
      reset: () => set(initialState, false, 'reset'),

      // Mark as clean (after save)
      markClean: () => set({ isDirty: false }, false, 'markClean'),
    }),
    { name: 'settings-form-store' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectBusinessHours = (state: SettingsFormState) => state.businessHours;
export const selectSlotDuration = (state: SettingsFormState) => state.slotDuration;
export const selectBookingAdvanceDays = (state: SettingsFormState) => state.bookingAdvanceDays;
export const selectHolidays = (state: SettingsFormState) => state.holidays;
export const selectNewHoliday = (state: SettingsFormState) => state.newHoliday;
export const selectInterpreterEnabled = (state: SettingsFormState) => state.interpreterEnabled;
export const selectSupportedLanguages = (state: SettingsFormState) => state.supportedLanguages;
export const selectContactChannels = (state: SettingsFormState) => state.contactChannels;
export const selectIsDirty = (state: SettingsFormState) => state.isDirty;
