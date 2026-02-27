'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { BusinessHours } from '@/types';
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
    <div className="bg-secondary-50 rounded-lg overflow-hidden">
      <table className="w-full">
        <tbody>
          {workHours
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((wh) => {
              const salonClosed = isSalonClosedOnDay?.(wh.dayOfWeek) ?? false;
              return (
                <tr
                  key={wh.dayOfWeek}
                  className={`border-b border-secondary-200 last:border-b-0 ${
                    salonClosed ? 'opacity-50 bg-secondary-100' : ''
                  }`}
                >
                  {/* 토글 */}
                  <td className="w-14 py-2.5 pl-3 pr-2">
                    <button
                      type="button"
                      onClick={() => onToggleDay(wh.dayOfWeek)}
                      disabled={salonClosed}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        salonClosed
                          ? 'bg-secondary-300 cursor-not-allowed'
                          : wh.isOpen
                            ? 'bg-primary-500'
                            : 'bg-secondary-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          wh.isOpen && !salonClosed ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  {/* 요일 */}
                  <td className="w-16 py-2.5 pr-3">
                    <span
                      className={`text-sm font-medium ${
                        wh.dayOfWeek === 0
                          ? 'text-error-500'
                          : wh.dayOfWeek === 6
                            ? 'text-info-600'
                            : 'text-secondary-700'
                      }`}
                    >
                      {t(DAY_KEYS[wh.dayOfWeek])}
                    </span>
                  </td>
                  {/* 시간 */}
                  <td className="py-2.5 pr-3">
                    {salonClosed ? (
                      <span className="text-secondary-400 text-xs">
                        {t('staff.schedule.salonClosed')}
                      </span>
                    ) : wh.isOpen ? (
                      <div className="flex items-center gap-2">
                        <div className="w-[76px]">
                          <Select
                            value={wh.openTime}
                            onChange={(e) =>
                              onTimeChange(wh.dayOfWeek, 'openTime', e.target.value)
                            }
                            options={TIME_OPTIONS}
                            showPlaceholder={false}
                            className="h-8 px-2 py-1 text-sm rounded-md"
                          />
                        </div>
                        <span className="text-secondary-400 text-sm">~</span>
                        <div className="w-[76px]">
                          <Select
                            value={wh.closeTime}
                            onChange={(e) =>
                              onTimeChange(wh.dayOfWeek, 'closeTime', e.target.value)
                            }
                            options={TIME_OPTIONS}
                            showPlaceholder={false}
                            className="h-8 px-2 py-1 text-sm rounded-md"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-secondary-400 text-xs">
                        {t('staff.schedule.closed')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
