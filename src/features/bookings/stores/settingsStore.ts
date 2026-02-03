'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BusinessHours, Holiday } from '@/types';
import { SupportedLanguage } from '../constants';
import { getDefaultBusinessHours, getTodayString } from '../utils';

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

  // Initialize from server data
  initializeFromServer: (data: {
    businessHours?: BusinessHours[];
    holidays?: Holiday[];
    settings?: {
      slot_duration_minutes?: number;
      booking_advance_days?: number;
      interpreter_enabled?: boolean;
      supported_languages?: SupportedLanguage[];
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

const initialState = {
  businessHours: getDefaultBusinessHours(),
  slotDuration: 30,
  bookingAdvanceDays: 30,
  holidays: [] as Holiday[],
  newHoliday: initialNewHoliday,
  interpreterEnabled: false,
  supportedLanguages: [] as SupportedLanguage[],
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
          (state) => ({
            interpreterEnabled: !state.interpreterEnabled,
            isDirty: true,
          }),
          false,
          'toggleInterpreterEnabled'
        ),

      setSupportedLanguages: (languages) =>
        set({ supportedLanguages: languages, isDirty: true }, false, 'setSupportedLanguages'),

      toggleLanguage: (language) =>
        set(
          (state) => ({
            supportedLanguages: state.supportedLanguages.includes(language)
              ? state.supportedLanguages.filter((l) => l !== language)
              : [...state.supportedLanguages, language],
            isDirty: true,
          }),
          false,
          'toggleLanguage'
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
export const selectIsDirty = (state: SettingsFormState) => state.isDirty;
