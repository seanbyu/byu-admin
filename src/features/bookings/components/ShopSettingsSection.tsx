'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Holiday } from '@/types';
import { useSalonSettings, useBusinessHoursMutation, useHolidaysMutation } from '../hooks/useSalonSettings';
import { useSettingsFormStore } from '../stores/settingsStore';
import { BusinessSettingsCard, HolidaySettingsCard } from './booking-settings';

interface ShopSettingsSectionProps {
  salonId: string;
}

export function ShopSettingsSection({ salonId }: ShopSettingsSectionProps) {
  const t = useTranslations();

  // Tanstack Query - fetch settings
  const { data, isLoading } = useSalonSettings(salonId);

  // Mutations
  const businessHoursMutation = useBusinessHoursMutation(salonId);
  const holidaysMutation = useHolidaysMutation(salonId);

  // Local state for save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Zustand store for form state
  const {
    businessHours,
    slotDuration,
    bookingAdvanceDays,
    holidays,
    newHoliday,
    initializeFromServer,
    toggleDayOpen,
    setDayTime,
    setSlotDuration,
    setBookingAdvanceDays,
    setNewHolidayField,
    addHoliday,
    removeHoliday,
    markClean,
  } = useSettingsFormStore();

  // Initialize form from server data
  useEffect(() => {
    if (data) {
      initializeFromServer({
        businessHours: data.businessHours,
        holidays: data.holidays,
        settings: data.settings,
      });
    }
  }, [data, initializeFromServer]);

  // Handlers
  const handleToggleDay = useCallback(
    (dayOfWeek: number) => {
      toggleDayOpen(dayOfWeek);
    },
    [toggleDayOpen]
  );

  const handleTimeChange = useCallback(
    (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
      setDayTime(dayOfWeek, field, value);
    },
    [setDayTime]
  );

  const handleNewHolidayChange = useCallback(
    (field: string, value: string) => {
      setNewHolidayField(field, value);
    },
    [setNewHolidayField]
  );

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

    addHoliday(holiday);

    // Save holidays immediately
    holidaysMutation.mutateHolidays([...holidays, holiday]);
  }, [newHoliday, addHoliday, holidays, holidaysMutation]);

  const handleRemoveHoliday = useCallback(
    (id: string) => {
      removeHoliday(id);

      // Save holidays immediately
      const updatedHolidays = holidays.filter((h) => h.id !== id);
      holidaysMutation.mutateHolidays(updatedHolidays);
    },
    [removeHoliday, holidays, holidaysMutation]
  );

  const handleSave = useCallback(async () => {
    try {
      await businessHoursMutation.mutateBusinessHours(
        businessHours,
        slotDuration,
        bookingAdvanceDays
      );
      markClean();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save shop settings:', error);
    }
  }, [businessHours, slotDuration, bookingAdvanceDays, businessHoursMutation, markClean]);

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
        isSaving={businessHoursMutation.isPending}
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
