// ============================================
// Bookings Feature - Main Export
// ============================================

// Types
export * from './types';

// API
export { createBookingsApi } from './api';

// Constants & Utils
export * from './constants';
export * from './utils';

// Stores (Zustand)
export {
  useBookingsUIStore,
  selectShowNewBookingModal,
  selectShowShopSettingsModal,
  selectShowStaffScheduleModal,
  selectSelectedDate,
  selectStatusFilter,
  selectSelectedTime,
  selectSelectedStaffId,
} from './stores/bookingsStore';

export {
  useSettingsFormStore,
  selectBusinessHours,
  selectSlotDuration,
  selectBookingAdvanceDays,
  selectHolidays,
  selectNewHoliday,
  selectInterpreterEnabled,
  selectSupportedLanguages,
  selectIsDirty,
} from './stores/settingsStore';

// Query Keys & Options
export {
  bookingKeys,
  salonSettingsKeys,
  BOOKINGS_QUERY_OPTIONS,
  SALON_SETTINGS_QUERY_OPTIONS,
} from './hooks/queries';

// Hooks
export { useBookings } from './hooks/useBookings';
export {
  useSalonSettings,
  useSalonSettingsMutation,
  useBusinessHoursMutation,
  useHolidaysMutation,
  useInterpreterSettingsMutation,
} from './hooks/useSalonSettings';
export {
  useBookingsPageState,
  useBookingsData,
  type ArtistOption,
} from './hooks/useBookingsPageState';

// Components
export {
  ShopSettingsSection,
  InterpreterServiceSection,
  StaffBookingSection,
  NewBookingModal,
  StaffScheduleEditModal,
  StaffScheduleModal,
  ShopSettingsModal,
  BusinessSettingsCard,
  HolidaySettingsCard,
  InterpreterServiceCard,
  StaffBookingCard,
} from './views/components';

// Views
export { default as BookingsPageView } from './views/BookingsPageView';
