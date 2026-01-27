import { BusinessHours, Holiday } from '@/types';
import { WorkSchedule, HolidayEntry } from '../types';

// DB 요일명 매핑
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// ============================================================
// 변환 함수: admin 프론트 타입 ↔ DB(WorkSchedule) 타입
// ============================================================

/** BusinessHours[] → DB WorkSchedule 변환 (저장 시 사용) */
export function toWorkSchedule(hours: BusinessHours[]): WorkSchedule {
  const schedule: WorkSchedule = {};
  for (const dayName of DAY_NAMES) {
    schedule[dayName] = { enabled: false, start: null, end: null };
  }
  for (const h of hours) {
    const dayName = DAY_NAMES[h.dayOfWeek];
    if (dayName) {
      schedule[dayName] = {
        enabled: h.isOpen,
        start: h.isOpen ? h.openTime : null,
        end: h.isOpen ? h.closeTime : null,
      };
    }
  }
  return schedule;
}

/** DB WorkSchedule → BusinessHours[] 변환 (로드 시 사용) */
export function fromWorkSchedule(schedule: WorkSchedule | null | undefined): BusinessHours[] {
  if (!schedule) return [];
  const result: BusinessHours[] = [];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const dayName = DAY_NAMES[i];
    const entry = schedule[dayName];
    if (entry) {
      result.push({
        dayOfWeek: i,
        isOpen: entry.enabled,
        openTime: entry.start ?? '09:00',
        closeTime: entry.end ?? '18:00',
      });
    }
  }
  return result;
}

// ============================================================
// 매장 영업시간도 DB 포맷일 수 있으므로 대응
// ============================================================

type SalonBusinessHoursDB = {
  [dayName: string]: {
    enabled: boolean;
    open: string;
    close: string;
  };
};

/** 매장 DB business_hours → BusinessHours[] 변환 */
export function fromSalonBusinessHours(
  hours: SalonBusinessHoursDB | BusinessHours[] | null | undefined
): BusinessHours[] {
  if (!hours) return [];
  // 이미 배열이면 그대로 반환
  if (Array.isArray(hours)) return hours;
  // 객체 형태(DB)이면 변환
  const result: BusinessHours[] = [];
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const dayName = DAY_NAMES[i];
    const entry = hours[dayName];
    if (entry) {
      result.push({
        dayOfWeek: i,
        isOpen: entry.enabled,
        openTime: entry.open ?? '09:00',
        closeTime: entry.close ?? '18:00',
      });
    }
  }
  return result;
}

// ============================================================
// isStaffWorking: 특정 날짜에 직원이 근무 가능한지 판단
// ============================================================

interface StaffAvailability {
  isWorking: boolean;
  reason?: 'salon_closed' | 'staff_day_off' | 'staff_holiday';
  workingHours?: { openTime: string; closeTime: string };
}

interface SalonScheduleInput {
  businessHours: BusinessHours[] | SalonBusinessHoursDB;
  holidays?: Holiday[] | HolidayEntry[] | null;
}

interface StaffScheduleInput {
  workHours?: BusinessHours[];
  workSchedule?: WorkSchedule | null;
  holidays?: Holiday[] | HolidayEntry[] | null;
}

export function isStaffWorking(
  date: Date,
  salon: SalonScheduleInput,
  staff: StaffScheduleInput
): StaffAvailability {
  const dayOfWeek = date.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const dateStr = formatDateStr(date);

  // 매장 영업시간 판단 (배열 또는 DB 객체 모두 대응)
  const salonHours = Array.isArray(salon.businessHours)
    ? salon.businessHours
    : fromSalonBusinessHours(salon.businessHours);

  // 1. 매장 정기 휴무 체크
  const salonDay = salonHours.find(h => h.dayOfWeek === dayOfWeek);
  if (!salonDay || !salonDay.isOpen) {
    return { isWorking: false, reason: 'salon_closed' };
  }

  // 2. 매장 특별 휴무일 체크
  if (isDateInHolidays(dateStr, salon.holidays)) {
    return { isWorking: false, reason: 'salon_closed' };
  }

  // 3. 직원 정기 휴무 체크 (workSchedule DB 포맷 우선, 없으면 workHours 사용)
  if (staff.workSchedule) {
    const dayEntry = staff.workSchedule[dayName];
    if (!dayEntry || !dayEntry.enabled) {
      return { isWorking: false, reason: 'staff_day_off' };
    }
    // 4. 직원 특별 휴가 체크
    if (isDateInHolidays(dateStr, staff.holidays)) {
      return { isWorking: false, reason: 'staff_holiday' };
    }
    return {
      isWorking: true,
      workingHours: {
        openTime: dayEntry.start ?? salonDay.openTime,
        closeTime: dayEntry.end ?? salonDay.closeTime,
      },
    };
  }

  // workHours(프론트 배열) 사용
  const staffDay = staff.workHours?.find(h => h.dayOfWeek === dayOfWeek);
  if (!staffDay || !staffDay.isOpen) {
    return { isWorking: false, reason: 'staff_day_off' };
  }

  // 4. 직원 특별 휴가 체크
  if (isDateInHolidays(dateStr, staff.holidays)) {
    return { isWorking: false, reason: 'staff_holiday' };
  }

  return {
    isWorking: true,
    workingHours: { openTime: staffDay.openTime, closeTime: staffDay.closeTime },
  };
}

// ============================================================
// 내부 헬퍼
// ============================================================

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Holiday[] 또는 HolidayEntry[] 모두 대응하는 휴무일 체크 */
function isDateInHolidays(
  dateStr: string,
  holidays: Holiday[] | HolidayEntry[] | null | undefined
): boolean {
  if (!holidays || holidays.length === 0) return false;
  return holidays.some((h) => {
    // HolidayEntry: string 형태
    if (typeof h === 'string') return h === dateStr;
    // HolidayEntry: { date, reason } 형태
    if ('date' in h && !('startDate' in h)) {
      return (h as { date: string }).date === dateStr;
    }
    // Holiday: { startDate, endDate } 범위 형태
    if ('startDate' in h && 'endDate' in h) {
      const hh = h as Holiday;
      return dateStr >= hh.startDate && dateStr <= hh.endDate;
    }
    return false;
  });
}
