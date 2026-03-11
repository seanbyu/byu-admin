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

  const isAddDisabled = !newHoliday.startDate || !newHoliday.endDate || !newHoliday.reason;

  return (
    <div className="rounded-xl border border-secondary-200 overflow-hidden">
      {/* 입력 폼 */}
      <div className="p-4 space-y-3 bg-secondary-50">
        {/* 날짜 2열 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">
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
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">
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
        </div>

        {/* 사유 + 추가 버튼 */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-secondary-600 mb-1">
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
            variant="primary"
            size="sm"
            onClick={handleAdd}
            className="h-9 px-4 flex-shrink-0"
            disabled={isAddDisabled}
          >
            <Plus size={14} className="mr-1" />
            {t('common.add')}
          </Button>
        </div>
      </div>

      {/* 휴가 목록 */}
      {holidays.length > 0 ? (
        <div className="divide-y divide-secondary-200">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between px-4 py-3 bg-white"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-secondary-900">
                  {holiday.startDate} ~ {holiday.endDate}
                </span>
                <span className="text-xs text-secondary-500">{holiday.reason}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveHoliday(holiday.id)}
                className="h-8 w-8 p-0 text-error-400 hover:text-error-600 hover:bg-error-50 flex-shrink-0"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-secondary-400 text-center py-4 bg-white">
          {t('staff.schedule.noHolidays')}
        </p>
      )}
    </div>
  );
}
