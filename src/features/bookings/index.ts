// Types
export * from './types';

// API
export { createBookingsApi } from './api';

// Stores (Zustand)
export {
  useBookingsUIStore,
  selectShowNewBookingModal,
  selectShowShopSettingsModal,
  selectShowStaffScheduleModal,
  selectSelectedDate,
  selectStatusFilter,
  selectViewMode,
  selectSelectedTime,
  selectSelectedStaffId,
  selectBookingsUIActions,
} from './stores/bookingsStore';

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
  useBookingsPageState,
  useBookingsData,
  type CalendarEvent,
  type CalendarResource,
  type CalendarResourceWorkHours,
  type DesignerOption,
} from './hooks/useBookingsPageState';

// Views
export { default as BookingsPageView } from './views/BookingsPageView';
