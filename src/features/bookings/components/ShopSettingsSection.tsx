'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { BusinessHours, Holiday } from '@/types';
import { Trash2, Plus, Check, Store, CalendarOff } from 'lucide-react';
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
    openTime: '10:00',
    closeTime: '19:00',
    isOpen: i !== 1, // Monday off
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

// 영업 설정 섹션 (영업 시간 + 예약 설정)
export const BusinessSettingsCard = memo(function BusinessSettingsCard({
  businessHours,
  slotDuration,
  bookingAdvanceDays,
  onToggleDay,
  onTimeChange,
  onSlotDurationChange,
  onBookingAdvanceDaysChange,
  onSave,
  isSaving,
  saveSuccess,
}: {
  businessHours: BusinessHours[];
  slotDuration: number;
  bookingAdvanceDays: number;
  onToggleDay: (dayOfWeek: number) => void;
  onTimeChange: (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => void;
  onSlotDurationChange: (value: number) => void;
  onBookingAdvanceDaysChange: (value: number) => void;
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
}) {
  const t = useTranslations();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-secondary-600" />
          <h2 className="text-base font-semibold text-secondary-900">
            {t('booking.shopSettingsModal.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check size={14} />
            </span>
          )}
          <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
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

        {/* 영업 시간 설정 */}
        <div>
          <label className="block text-xs font-medium text-secondary-600 mb-2">
            {t('booking.shopSettingsModal.businessHours')}
          </label>
          <div className="bg-secondary-50 rounded-lg p-3">
            <div className="space-y-2">
              {businessHours
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((bh) => (
                  <div
                    key={bh.dayOfWeek}
                    className="flex items-center gap-3 py-1.5 border-b border-secondary-200 last:border-b-0"
                  >
                    {/* 토글 */}
                    <button
                      type="button"
                      onClick={() => onToggleDay(bh.dayOfWeek)}
                      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
                        bh.isOpen ? 'bg-primary-500' : 'bg-secondary-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          bh.isOpen ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>

                    {/* 요일 */}
                    <span
                      className={`text-sm font-medium w-12 shrink-0 ${
                        bh.dayOfWeek === 0
                          ? 'text-red-500'
                          : bh.dayOfWeek === 6
                            ? 'text-blue-500'
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
                          className="w-[88px]"
                          showPlaceholder={false}
                        />
                        <span className="text-secondary-400 text-xs">~</span>
                        <Select
                          options={TIME_OPTIONS}
                          value={bh.closeTime}
                          onChange={(e) =>
                            onTimeChange(bh.dayOfWeek, 'closeTime', e.target.value)
                          }
                          className="w-[88px]"
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
        </div>
      </div>
    </Card>
  );
});

// 휴무일 설정 섹션
export const HolidaySettingsCard = memo(function HolidaySettingsCard({
  holidays,
  newHoliday,
  onNewHolidayChange,
  onAddHoliday,
  onRemoveHoliday,
}: {
  holidays: Holiday[];
  newHoliday: { startDate: string; endDate: string; reason: string };
  onNewHolidayChange: (field: string, value: string) => void;
  onAddHoliday: () => void;
  onRemoveHoliday: (id: string) => void;
}) {
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
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary-400 text-center py-6 bg-secondary-50 rounded-lg">
              {t('booking.shopSettingsModal.noClosedDays')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
});

// 메인 컴포넌트 (상태 관리)
export function ShopSettingsSection({ salonId }: ShopSettingsSectionProps) {
  const t = useTranslations();
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(getDefaultBusinessHours());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newHoliday, setNewHoliday] = useState({
    startDate: getTodayString(),
    endDate: '',
    reason: '',
  });

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
        if (response.data.settings?.booking_advance_days) {
          setBookingAdvanceDays(response.data.settings.booking_advance_days);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDay = useCallback((dayOfWeek: number) => {
    setBusinessHours((prev) =>
      prev.map((bh) =>
        bh.dayOfWeek === dayOfWeek ? { ...bh, isOpen: !bh.isOpen } : bh
      )
    );
  }, []);

  const handleTimeChange = useCallback((
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setBusinessHours((prev) =>
      prev.map((bh) =>
        bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh
      )
    );
  }, []);

  const handleNewHolidayChange = useCallback((field: string, value: string) => {
    setNewHoliday((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddHoliday = useCallback(() => {
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
  }, [newHoliday]);

  const handleRemoveHoliday = useCallback((id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    if (!salonId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await salonsApi.updateSettings(salonId, {
        businessHours,
        holidays,
        settings: {
          slot_duration_minutes: slotDuration,
          booking_advance_days: bookingAdvanceDays,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save shop settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [salonId, businessHours, holidays, slotDuration, bookingAdvanceDays]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-center py-12">
            <div className="text-secondary-500">{t('common.loading')}</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-center py-12">
            <div className="text-secondary-500">{t('common.loading')}</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BusinessSettingsCard
        businessHours={businessHours}
        slotDuration={slotDuration}
        bookingAdvanceDays={bookingAdvanceDays}
        onToggleDay={handleToggleDay}
        onTimeChange={handleTimeChange}
        onSlotDurationChange={setSlotDuration}
        onBookingAdvanceDaysChange={setBookingAdvanceDays}
        onSave={handleSave}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
      />
      <HolidaySettingsCard
        holidays={holidays}
        newHoliday={newHoliday}
        onNewHolidayChange={handleNewHolidayChange}
        onAddHoliday={handleAddHoliday}
        onRemoveHoliday={handleRemoveHoliday}
      />
    </div>
  );
}
