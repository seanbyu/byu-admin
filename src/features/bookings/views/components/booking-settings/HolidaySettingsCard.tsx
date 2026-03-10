'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { Holiday } from '@/types';
import { Trash2, Plus, CalendarOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

interface HolidaySettingsCardProps {
  holidays: Holiday[];
  newHoliday: { startDate: string; endDate: string; reason: string };
  onNewHolidayChange: (field: string, value: string) => void;
  onAddHoliday: () => void;
  onRemoveHoliday: (id: string) => void;
}

export const HolidaySettingsCard = memo(function HolidaySettingsCard({
  holidays,
  newHoliday,
  onNewHolidayChange,
  onAddHoliday,
  onRemoveHoliday,
}: HolidaySettingsCardProps) {
  const t = useTranslations();

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarOff size={18} className="text-secondary-600" />
        <h2 className="text-base font-semibold text-secondary-900">
          {t('booking.shopSettingsModal.closedDays')}
        </h2>
      </div>

      <div className="space-y-4">
        {/* 새 휴무일 입력 */}
        <div className="bg-secondary-50 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <DatePicker
              label={t('common.form.startDate')}
              value={newHoliday.startDate}
              onChange={(date) => onNewHolidayChange('startDate', date)}
            />
            <DatePicker
              label={t('common.form.endDate')}
              value={newHoliday.endDate}
              onChange={(date) => onNewHolidayChange('endDate', date)}
              minDate={newHoliday.startDate ? new Date(newHoliday.startDate) : undefined}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label={t('common.form.reason')}
                placeholder={t('booking.shopSettingsModal.reasonPlaceholder')}
                value={newHoliday.reason}
                onChange={(e) => onNewHolidayChange('reason', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddHoliday}
                disabled={
                  !newHoliday.startDate ||
                  !newHoliday.endDate ||
                  !newHoliday.reason
                }
                className="h-10"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* 휴무일 목록 */}
        <div>
          <h4 className="text-xs font-medium text-secondary-600 mb-2">
            {t('booking.shopSettingsModal.closedDaysList')}
          </h4>
          {holidays.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-2.5 bg-secondary-50 rounded-lg"
                >
                  <div className="text-sm">
                    <span className="font-medium text-secondary-900">
                      {holiday.startDate} ~ {holiday.endDate}
                    </span>
                    <span className="ml-2 text-secondary-500">
                      {holiday.reason}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveHoliday(holiday.id)}
                    className="p-1 text-error-500 hover:bg-error-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message={t('booking.shopSettingsModal.noClosedDays')} size="sm" className="bg-secondary-50 rounded-lg" />
          )}
        </div>
      </div>
    </Card>
  );
});
