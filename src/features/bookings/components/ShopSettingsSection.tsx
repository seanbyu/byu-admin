'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { BusinessHours, Holiday } from '@/types';
import { Trash2, Plus, Check } from 'lucide-react';
import { salonsApi } from '@/features/salons/api';

interface ShopSettingsSectionProps {
  salonId: string;
}

// 요일 키 매핑
const DAY_KEYS = [
  'common.dayNames.sunday',
  'common.dayNames.monday',
  'common.dayNames.tuesday',
  'common.dayNames.wednesday',
  'common.dayNames.thursday',
  'common.dayNames.friday',
  'common.dayNames.saturday',
] as const;

// 08:00 ~ 22:00 시간 옵션 (15개)
const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = (i + 8).toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const getDefaultBusinessHours = (): BusinessHours[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '08:00',
    closeTime: '22:00',
    isOpen: i !== 0,
  }));
};

// 오늘 날짜를 yyyy-MM-dd 형식으로 반환
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ShopSettingsSection({ salonId }: ShopSettingsSectionProps) {
  const t = useTranslations();
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(getDefaultBusinessHours());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 새 휴무일 입력 상태 (시작일은 오늘로 기본값)
  const [newHoliday, setNewHoliday] = useState({
    startDate: getTodayString(),
    endDate: '',
    reason: '',
  });

  // 데이터 로드
  useEffect(() => {
    if (salonId) {
      loadSettings();
    }
  }, [salonId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await salonsApi.getSettings(salonId);
      if (response.success && response.data) {
        if (response.data.businessHours?.length > 0) {
          setBusinessHours(response.data.businessHours);
        }
        if (response.data.holidays) {
          setHolidays(response.data.holidays);
        }
        if (response.data.settings?.slot_duration_minutes) {
          setSlotDuration(response.data.settings.slot_duration_minutes);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setBusinessHours((prev) =>
      prev.map((bh) =>
        bh.dayOfWeek === dayOfWeek ? { ...bh, isOpen: !bh.isOpen } : bh
      )
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setBusinessHours((prev) =>
      prev.map((bh) =>
        bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh
      )
    );
  };

  const handleAddHoliday = () => {
    if (!newHoliday.startDate || !newHoliday.endDate || !newHoliday.reason) {
      return;
    }

    const holiday: Holiday = {
      id: `holiday-${Date.now()}`,
      startDate: newHoliday.startDate,
      endDate: newHoliday.endDate,
      reason: newHoliday.reason,
    };

    setHolidays((prev) => [...prev, holiday]);
    setNewHoliday({ startDate: getTodayString(), endDate: '', reason: '' });
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSave = async () => {
    if (!salonId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await salonsApi.updateSettings(salonId, {
        businessHours,
        holidays,
        settings: { slot_duration_minutes: slotDuration },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save shop settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-secondary-900">
          {t('booking.shopSettingsModal.title')}
        </h2>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check size={16} />
              {t('common.saved')}
            </span>
          )}
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 예약 시간 단위 설정 */}
        <div>
          <h3 className="text-sm font-medium text-secondary-700 mb-3">
            {t('booking.shopSettingsModal.slotDuration')}
          </h3>
          <div className="bg-secondary-50 rounded-lg p-4">
            <Select
              options={[
                { value: '30', label: t('booking.shopSettingsModal.slotDuration30') },
                { value: '60', label: t('booking.shopSettingsModal.slotDuration60') },
              ]}
              value={String(slotDuration)}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-40"
              showPlaceholder={false}
            />
          </div>
        </div>

        {/* 영업 시간 설정 */}
        <div>
          <h3 className="text-sm font-medium text-secondary-700 mb-3">
            {t('booking.shopSettingsModal.businessHours')}
          </h3>
          <div className="bg-secondary-50 rounded-lg p-4">
            <div className="space-y-3">
              {businessHours
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((bh) => (
                  <div
                    key={bh.dayOfWeek}
                    className="flex items-center gap-4 py-2 border-b border-secondary-200 last:border-b-0"
                  >
                    {/* 요일 및 토글 */}
                    <div className="min-w-[120px] flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(bh.dayOfWeek)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          bh.isOpen ? 'bg-primary-500' : 'bg-secondary-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            bh.isOpen ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm font-medium ${
                          bh.dayOfWeek === 0
                            ? 'text-red-500'
                            : bh.dayOfWeek === 6
                              ? 'text-blue-500'
                              : 'text-secondary-700'
                        }`}
                      >
                        {t(DAY_KEYS[bh.dayOfWeek])}
                      </span>
                    </div>

                    {/* 시간 선택 */}
                    {bh.isOpen ? (
                      <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                        <Select
                          options={TIME_OPTIONS}
                          value={bh.openTime}
                          onChange={(e) =>
                            handleTimeChange(bh.dayOfWeek, 'openTime', e.target.value)
                          }
                          className="w-24 sm:w-28"
                          showPlaceholder={false}
                        />
                        <span className="text-secondary-500">~</span>
                        <Select
                          options={TIME_OPTIONS}
                          value={bh.closeTime}
                          onChange={(e) =>
                            handleTimeChange(bh.dayOfWeek, 'closeTime', e.target.value)
                          }
                          className="w-24 sm:w-28"
                          showPlaceholder={false}
                        />
                      </div>
                    ) : (
                      <span className="text-secondary-400 text-sm flex-1">
                        {t('staff.schedule.closed')}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 휴무일 설정 */}
        <div>
          <h3 className="text-sm font-medium text-secondary-700 mb-3">
            {t('booking.shopSettingsModal.closedDays')}
          </h3>
          <div className="bg-secondary-50 rounded-lg p-4">
            {/* 새 휴무일 입력 */}
            <div className="space-y-3 mb-4">
              {/* 첫번째 줄: 시작일, 종료일 */}
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label={t('common.form.startDate')}
                  value={newHoliday.startDate}
                  onChange={(date) =>
                    setNewHoliday((prev) => ({ ...prev, startDate: date }))
                  }
                />
                <DatePicker
                  label={t('common.form.endDate')}
                  value={newHoliday.endDate}
                  onChange={(date) =>
                    setNewHoliday((prev) => ({ ...prev, endDate: date }))
                  }
                  minDate={newHoliday.startDate ? new Date(newHoliday.startDate) : undefined}
                />
              </div>
              {/* 두번째 줄: 사유, 추가 버튼 */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('common.form.reason')}
                  placeholder={t('booking.shopSettingsModal.reasonPlaceholder')}
                  value={newHoliday.reason}
                  onChange={(e) =>
                    setNewHoliday((prev) => ({ ...prev, reason: e.target.value }))
                  }
                />
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleAddHoliday}
                    className="w-full"
                    disabled={
                      !newHoliday.startDate ||
                      !newHoliday.endDate ||
                      !newHoliday.reason
                    }
                  >
                    <Plus size={16} className="mr-1" />
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            </div>

            {/* 휴무일 목록 */}
            {holidays.length > 0 ? (
              <div className="border-t border-secondary-200 pt-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">
                  {t('booking.shopSettingsModal.closedDaysList')}
                </h4>
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-secondary-200"
                    >
                      <div>
                        <span className="font-medium text-secondary-900">
                          {holiday.startDate} ~ {holiday.endDate}
                        </span>
                        <span className="ml-3 text-secondary-600">
                          {holiday.reason}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHoliday(holiday.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-secondary-500 text-center py-4">
                {t('booking.shopSettingsModal.noClosedDays')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
