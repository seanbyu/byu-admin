'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { BusinessHours } from '@/types';
import { Check, Store } from 'lucide-react';
import { DAY_KEYS, TIME_OPTIONS } from '../../../constants';

interface BusinessSettingsCardProps {
  businessHours: BusinessHours[];
  slotDuration: number;
  bookingAdvanceDays: number;
  cancellationHours: number;
  onToggleDay: (dayOfWeek: number) => void;
  onTimeChange: (
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => void;
  onSlotDurationChange: (value: number) => void;
  onBookingAdvanceDaysChange: (value: number) => void;
  onCancellationHoursChange: (value: number) => void;
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  isDirty: boolean;
}

export const BusinessSettingsCard = memo(function BusinessSettingsCard({
  businessHours,
  slotDuration,
  bookingAdvanceDays,
  cancellationHours,
  onToggleDay,
  onTimeChange,
  onSlotDurationChange,
  onBookingAdvanceDaysChange,
  onCancellationHoursChange,
  onSave,
  isSaving,
  saveSuccess,
  isDirty,
}: BusinessSettingsCardProps) {
  const t = useTranslations();

  return (
    <Card padding="none" className="overflow-hidden">
      {/* 헤더 */}
      <div className="px-3 pt-3 sm:px-4 sm:pt-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-secondary-600" />
          <h2 className="text-base font-semibold text-secondary-900">
            {t('booking.shopSettingsModal.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-success-600">
              <Check size={14} />
            </span>
          )}
          <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      {/* 셀렉트 영역 */}
      <div className="px-3 sm:px-4 space-y-4">
        {/* 예약 시간 단위 및 예약 가능 기간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">
              {t('booking.shopSettingsModal.slotDuration')}
            </label>
            <Select
              options={[
                { value: '30', label: t('booking.shopSettingsModal.slotDuration30') },
                { value: '60', label: t('booking.shopSettingsModal.slotDuration60') },
              ]}
              value={String(slotDuration)}
              onChange={(e) => onSlotDurationChange(Number(e.target.value))}
              className="w-full"
              showPlaceholder={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-600 mb-1">
              {t('booking.shopSettingsModal.bookingAdvanceDays')}
            </label>
            <Select
              options={[
                { value: '7', label: t('booking.shopSettingsModal.bookingAdvanceDays7') },
                { value: '14', label: t('booking.shopSettingsModal.bookingAdvanceDays14') },
                { value: '30', label: t('booking.shopSettingsModal.bookingAdvanceDays30') },
                { value: '60', label: t('booking.shopSettingsModal.bookingAdvanceDays60') },
                { value: '90', label: t('booking.shopSettingsModal.bookingAdvanceDays90') },
              ]}
              value={String(bookingAdvanceDays)}
              onChange={(e) => onBookingAdvanceDaysChange(Number(e.target.value))}
              className="w-full"
              showPlaceholder={false}
            />
          </div>
        </div>

        {/* 예약 변경/취소 마감 시간 */}
        <div>
          <label className="block text-xs font-medium text-secondary-600 mb-1">
            {t('booking.shopSettingsModal.cancellationHours')}
          </label>
          <Select
            options={[
              { value: '0', label: t('booking.shopSettingsModal.cancellationNone') },
              { value: '1', label: t('booking.shopSettingsModal.cancellation1h') },
              { value: '2', label: t('booking.shopSettingsModal.cancellation2h') },
              { value: '3', label: t('booking.shopSettingsModal.cancellation3h') },
              { value: '6', label: t('booking.shopSettingsModal.cancellation6h') },
              { value: '12', label: t('booking.shopSettingsModal.cancellation12h') },
              { value: '24', label: t('booking.shopSettingsModal.cancellation24h') },
              { value: '48', label: t('booking.shopSettingsModal.cancellation48h') },
            ]}
            value={String(cancellationHours)}
            onChange={(e) => onCancellationHoursChange(Number(e.target.value))}
            className="w-full"
            showPlaceholder={false}
          />
        </div>
      </div>

      {/* 영업 시간 설정 — full-bleed */}
      <div className="mt-4">
        <div className="px-4 mb-2">
          <label className="block text-xs font-medium text-secondary-600">
            {t('booking.shopSettingsModal.businessHours')}
          </label>
        </div>
        <div className="divide-y divide-secondary-200 border-t border-secondary-200">
          {businessHours
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((bh) => (
              <div
                key={bh.dayOfWeek}
                className="flex items-center gap-3 px-3 py-2.5 bg-white"
              >
                {/* 토글 */}
                <Switch
                  checked={bh.isOpen}
                  onCheckedChange={() => onToggleDay(bh.dayOfWeek)}
                />

                {/* 요일 */}
                <span
                  className={`text-sm font-medium w-10 shrink-0 ${
                    bh.dayOfWeek === 0
                      ? 'text-error-500'
                      : bh.dayOfWeek === 6
                        ? 'text-info-500'
                        : 'text-secondary-700'
                  }`}
                >
                  {t(DAY_KEYS[bh.dayOfWeek])}
                </span>

                {/* 시간 선택 */}
                {bh.isOpen ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      options={TIME_OPTIONS}
                      value={bh.openTime}
                      onChange={(e) =>
                        onTimeChange(bh.dayOfWeek, 'openTime', e.target.value)
                      }
                      className="h-8 w-[72px] px-1.5 py-1 text-sm rounded-md"
                      showPlaceholder={false}
                    />
                    <span className="text-secondary-400 text-xs">~</span>
                    <Select
                      options={TIME_OPTIONS}
                      value={bh.closeTime}
                      onChange={(e) =>
                        onTimeChange(bh.dayOfWeek, 'closeTime', e.target.value)
                      }
                      className="h-8 w-[72px] px-1.5 py-1 text-sm rounded-md"
                      showPlaceholder={false}
                    />
                  </div>
                ) : (
                  <span className="text-secondary-400 text-xs">
                    {t('staff.schedule.closed')}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
});
