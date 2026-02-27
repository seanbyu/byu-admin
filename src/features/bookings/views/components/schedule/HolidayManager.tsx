'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Holiday } from '@/types';
import { getTodayString } from '../../../utils';

interface HolidayManagerProps {
  holidays: Holiday[];
  onAddHoliday: (holiday: Holiday) => void;
  onRemoveHoliday: (id: string) => void;
}

export function HolidayManager({
  holidays,
  onAddHoliday,
  onRemoveHoliday,
}: HolidayManagerProps) {
  const t = useTranslations();
  const [newHoliday, setNewHoliday] = useState({
    startDate: getTodayString(),
    endDate: '',
    reason: '',
  });

  const handleAdd = useCallback(() => {
    if (!newHoliday.startDate || !newHoliday.endDate || !newHoliday.reason) return;

    onAddHoliday({
      id: `holiday-${Date.now()}`,
      startDate: newHoliday.startDate,
      endDate: newHoliday.endDate,
      reason: newHoliday.reason,
    });
    setNewHoliday({ startDate: getTodayString(), endDate: '', reason: '' });
  }, [newHoliday, onAddHoliday]);

  return (
    <div className="bg-secondary-50 rounded-lg p-4">
      {/* 새 휴가 입력 */}
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs text-secondary-600 mb-1">
            {t('common.form.startDate')}
          </label>
          <Input
            type="date"
            value={newHoliday.startDate}
            onChange={(e) =>
              setNewHoliday((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="h-9 px-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs text-secondary-600 mb-1">
            {t('common.form.endDate')}
          </label>
          <Input
            type="date"
            value={newHoliday.endDate}
            min={newHoliday.startDate}
            onChange={(e) =>
              setNewHoliday((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="h-9 px-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs text-secondary-600 mb-1">
            {t('common.form.reason')}
          </label>
          <Input
            type="text"
            placeholder={t('staff.schedule.reasonPlaceholder')}
            value={newHoliday.reason}
            onChange={(e) =>
              setNewHoliday((prev) => ({ ...prev, reason: e.target.value }))
            }
            className="h-9 px-2 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-9 px-3"
          disabled={!newHoliday.startDate || !newHoliday.endDate || !newHoliday.reason}
        >
          <Plus size={14} className="mr-1" />
          {t('common.add')}
        </Button>
      </div>

      {/* 휴가 목록 */}
      {holidays.length > 0 ? (
        <div className="border-t border-secondary-200 pt-3">
          <div className="space-y-2">
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-secondary-200"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-secondary-900">
                    {holiday.startDate} ~ {holiday.endDate}
                  </span>
                  <span className="text-secondary-500">{holiday.reason}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveHoliday(holiday.id)}
                  className="h-8 w-8 p-0 text-error-500 hover:bg-error-50 active:bg-error-100 focus:ring-error-500"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-secondary-400 text-center py-3 border-t border-secondary-200">
          {t('staff.schedule.noHolidays')}
        </p>
      )}
    </div>
  );
}
