// ============================================
// Shared Constants for Bookings Feature
// ============================================

// Day keys for i18n translation
export const DAY_KEYS = [
  'common.dayNames.sunday',
  'common.dayNames.monday',
  'common.dayNames.tuesday',
  'common.dayNames.wednesday',
  'common.dayNames.thursday',
  'common.dayNames.friday',
  'common.dayNames.saturday',
] as const;

// 08:00 ~ 22:00 time options (15 slots)
export const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = (i + 8).toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// Supported languages for interpreter service
export const SUPPORTED_LANGUAGES = ['ko', 'en', 'th', 'zh', 'ja', 'vi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Slot duration options
export const SLOT_DURATION_OPTIONS = [
  { value: '30', labelKey: 'booking.shopSettingsModal.slotDuration30' },
  { value: '60', labelKey: 'booking.shopSettingsModal.slotDuration60' },
] as const;

// Booking advance days options
export const BOOKING_ADVANCE_DAYS_OPTIONS = [
  { value: '7', labelKey: 'booking.shopSettingsModal.bookingAdvanceDays7' },
  { value: '14', labelKey: 'booking.shopSettingsModal.bookingAdvanceDays14' },
  { value: '30', labelKey: 'booking.shopSettingsModal.bookingAdvanceDays30' },
  { value: '60', labelKey: 'booking.shopSettingsModal.bookingAdvanceDays60' },
  { value: '90', labelKey: 'booking.shopSettingsModal.bookingAdvanceDays90' },
] as const;
