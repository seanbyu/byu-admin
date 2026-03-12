'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { ShopSettingsSkeleton } from '@/components/ui/Skeleton';
import { Holiday } from '@/types';
import { useSalonSettings, useBusinessHoursMutation, useHolidaysMutation } from '../../hooks/useSalonSettings';
import { useSettingsFormStore } from '../../stores/settingsStore';
import { BusinessSettingsCard, HolidaySettingsCard } from './booking-settings';

interface ShopSettingsSectionProps {
  salonId: string;
}

export function ShopSettingsSection({ salonId }: ShopSettingsSectionProps) {
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
    cancellationHours,
    holidays,
    newHoliday,
    initializeFromServer,
    toggleDayOpen,
    setDayTime,
    setSlotDuration,
    setBookingAdvanceDays,
    setCancellationHours,
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

  const isDirty = useMemo(() => {
    if (!data) return false;
    if (slotDuration !== (data.settings?.slot_duration_minutes ?? 30)) return true;
    if (bookingAdvanceDays !== (data.settings?.booking_advance_days ?? 30)) return true;
    if (cancellationHours !== (data.settings?.booking_cancellation_hours ?? 24)) return true;
    const serverHours = data.businessHours ?? [];
    if (businessHours.length !== serverHours.length) return true;
    return businessHours.some((bh) => {
      const sbh = serverHours.find((s) => s.dayOfWeek === bh.dayOfWeek);
      return !sbh || bh.isOpen !== sbh.isOpen || bh.openTime !== sbh.openTime || bh.closeTime !== sbh.closeTime;
    });
  }, [data, businessHours, slotDuration, bookingAdvanceDays, cancellationHours]);

  const handleSave = useCallback(async () => {
    try {
      await businessHoursMutation.mutateBusinessHours(
        businessHours,
        slotDuration,
        bookingAdvanceDays,
        cancellationHours
      );
      markClean();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save shop settings:', error);
    }
  }, [businessHours, slotDuration, bookingAdvanceDays, cancellationHours, businessHoursMutation, markClean]);

  if (isLoading) {
    return <ShopSettingsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BusinessSettingsCard
          businessHours={businessHours}
          slotDuration={slotDuration}
          bookingAdvanceDays={bookingAdvanceDays}
          cancellationHours={cancellationHours}
          onToggleDay={handleToggleDay}
          onTimeChange={handleTimeChange}
          onSlotDurationChange={setSlotDuration}
          onBookingAdvanceDaysChange={setBookingAdvanceDays}
          onCancellationHoursChange={setCancellationHours}
          onSave={handleSave}
          isSaving={businessHoursMutation.isPending}
          saveSuccess={saveSuccess}
          isDirty={isDirty}
        />
        <HolidaySettingsCard
          holidays={holidays}
          newHoliday={newHoliday}
          onNewHolidayChange={handleNewHolidayChange}
          onAddHoliday={handleAddHoliday}
          onRemoveHoliday={handleRemoveHoliday}
        />
      </div>
    </div>
  );
}
