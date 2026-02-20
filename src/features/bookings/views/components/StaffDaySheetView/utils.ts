export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_SHORT_TRANSLATION_KEYS: Record<DayKey, `booking.dayShort.${DayKey}`> = {
  sun: 'booking.dayShort.sun',
  mon: 'booking.dayShort.mon',
  tue: 'booking.dayShort.tue',
  wed: 'booking.dayShort.wed',
  thu: 'booking.dayShort.thu',
  fri: 'booking.dayShort.fri',
  sat: 'booking.dayShort.sat',
};

export const PAYMENT_METHOD_KEYS = {
  CARD: 'booking.paymentMethodCard',
  CASH: 'booking.paymentMethodCash',
  TRANSFER: 'booking.paymentMethodTransfer',
} as const;

export type PaymentMethodCode = keyof typeof PAYMENT_METHOD_KEYS;

export function isKnownPaymentMethod(method: string): method is PaymentMethodCode {
  return Object.prototype.hasOwnProperty.call(PAYMENT_METHOD_KEYS, method);
}

export function stripCountryCode(phone: string): string {
  if (!phone) return phone;
  // +66-95-559-7077 → 095-559-7077 / +82 10-1234-5678 → 010-1234-5678
  return phone.replace(/^\+\d{1,4}[-\s]?/, '0');
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number
): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += slotMinutes;
  }
  return slots;
}

export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
