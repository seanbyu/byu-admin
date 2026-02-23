'use client';

import { useTranslations } from 'next-intl';
import type { WorkSchedule } from '../../types';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// 매장 영업시간 DB 포맷
type SalonBusinessHours = {
  [dayName: string]: {
    enabled: boolean;
    open: string;
    close: string;
  };
};

interface StaffWorkScheduleProps {
  workSchedule: WorkSchedule;
  salonHours: SalonBusinessHours;
  onChange: (schedule: WorkSchedule) => void;
}

export function StaffWorkSchedule({ workSchedule, salonHours, onChange }: StaffWorkScheduleProps) {
  const t = useTranslations();

  const isSalonClosed = (dayName: string) => {
    const s = salonHours[dayName];
    return !s || !s.enabled;
  };

  const toggleDay = (dayName: string) => {
    const existing = workSchedule[dayName];
    if (existing) {
      onChange({
        ...workSchedule,
        [dayName]: { ...existing, enabled: !existing.enabled },
      });
    } else {
      const salon = salonHours[dayName];
      onChange({
        ...workSchedule,
        [dayName]: {
          enabled: true,
          start: salon?.open ?? '09:00',
          end: salon?.close ?? '18:00',
        },
      });
    }
  };

  const updateTime = (dayName: string, field: 'start' | 'end', value: string) => {
    const existing = workSchedule[dayName];
    if (!existing) return;
    onChange({
      ...workSchedule,
      [dayName]: { ...existing, [field]: value },
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-secondary-700">{t('staff.schedule.workHours')}</h3>
      <p className="text-xs text-secondary-500">{t('staff.schedule.workHoursHint')}</p>
      {DAY_NAMES.map((dayName, index) => {
        const salonClosed = isSalonClosed(dayName);
        const entry = workSchedule[dayName];
        const isOn = entry?.enabled ?? false;

        return (
          <div key={dayName} className="flex items-center gap-3">
            <span className="w-10 text-sm font-medium">{t(`common.shortDayNames.${DAY_KEYS[index]}`)}</span>

            {salonClosed ? (
              <span className="text-xs text-secondary-400">{t('staff.schedule.closed')}</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => toggleDay(dayName)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    isOn ? 'bg-primary-500' : 'bg-secondary-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    isOn ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>

                {isOn && (
                  <div className="flex items-center gap-1 text-sm">
                    <input
                      type="time"
                      value={entry?.start ?? '09:00'}
                      onChange={e => updateTime(dayName, 'start', e.target.value)}
                      className="border rounded px-1 py-0.5"
                    />
                    <span>~</span>
                    <input
                      type="time"
                      value={entry?.end ?? '18:00'}
                      onChange={e => updateTime(dayName, 'end', e.target.value)}
                      className="border rounded px-1 py-0.5"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
