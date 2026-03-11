'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { BusinessHours } from '@/types';
import { cn } from '@/lib/utils';
import { DAY_KEYS, TIME_OPTIONS } from '../../../constants';

interface WorkHoursEditorProps {
  workHours: BusinessHours[];
  onToggleDay: (dayOfWeek: number) => void;
  onTimeChange: (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => void;
  isSalonClosedOnDay?: (dayOfWeek: number) => boolean;
}

export function WorkHoursEditor({
  workHours,
  onToggleDay,
  onTimeChange,
  isSalonClosedOnDay,
}: WorkHoursEditorProps) {
  const t = useTranslations();

  return (
    <div className="divide-y divide-secondary-200 rounded-xl border border-secondary-200 overflow-hidden">
      {workHours
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((wh) => {
          const salonClosed = isSalonClosedOnDay?.(wh.dayOfWeek) ?? false;
          return (
            <div
              key={wh.dayOfWeek}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                salonClosed && 'opacity-50 bg-secondary-50'
              )}
            >
              {/* 토글 */}
              <Switch
                checked={wh.isOpen && !salonClosed}
                onCheckedChange={() => onToggleDay(wh.dayOfWeek)}
                disabled={salonClosed}
              />

              {/* 요일 */}
              <span
                className={cn(
                  'w-10 flex-shrink-0 text-sm font-medium',
                  wh.dayOfWeek === 0
                    ? 'text-error-500'
                    : wh.dayOfWeek === 6
                      ? 'text-info-600'
                      : 'text-secondary-700'
                )}
              >
                {t(DAY_KEYS[wh.dayOfWeek])}
              </span>

              {/* 시간 */}
              <div className="ml-auto">
                {salonClosed ? (
                  <span className="text-secondary-400 text-xs">
                    {t('staff.schedule.salonClosed')}
                  </span>
                ) : wh.isOpen ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={wh.openTime}
                      onChange={(e) => onTimeChange(wh.dayOfWeek, 'openTime', e.target.value)}
                      options={TIME_OPTIONS}
                      showPlaceholder={false}
                      className="h-8 w-[80px] px-2 py-1 text-sm rounded-md"
                    />
                    <span className="text-secondary-400 text-xs">~</span>
                    <Select
                      value={wh.closeTime}
                      onChange={(e) => onTimeChange(wh.dayOfWeek, 'closeTime', e.target.value)}
                      options={TIME_OPTIONS}
                      showPlaceholder={false}
                      className="h-8 w-[80px] px-2 py-1 text-sm rounded-md"
                    />
                  </div>
                ) : (
                  <span className="text-secondary-400 text-xs">
                    {t('staff.schedule.closed')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
