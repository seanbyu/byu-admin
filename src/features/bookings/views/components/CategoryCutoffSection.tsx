'use client';

import { useEffect, useCallback, useState } from 'react';
import { AccordionCardSkeleton } from '@/components/ui/Skeleton';
import { useSalonSettings, useCategoryLastBookingMutation } from '../../hooks/useSalonSettings';
import { CategoryCutoffCard } from './booking-settings';

interface CategoryCutoffSectionProps {
  salonId: string;
}

export function CategoryCutoffSection({ salonId }: CategoryCutoffSectionProps) {
  const { data, isLoading } = useSalonSettings(salonId);
  const mutation = useCategoryLastBookingMutation(salonId);

  const [categoryLastBookingTimes, setCategoryLastBookingTimes] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (data?.settings?.category_last_booking_times) {
      setCategoryLastBookingTimes(
        data.settings.category_last_booking_times as Record<string, string>
      );
    }
  }, [data]);

  const handleCutoffChange = useCallback((categoryId: string, time: string) => {
    setCategoryLastBookingTimes((prev) =>
      time
        ? { ...prev, [categoryId]: time }
        : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== categoryId))
    );
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await mutation.mutateCategoryLastBookingTimes(categoryLastBookingTimes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save category cutoff times:', error);
    }
  }, [categoryLastBookingTimes, mutation]);

  if (isLoading) {
    return <AccordionCardSkeleton />;
  }

  return (
    <CategoryCutoffCard
      salonId={salonId}
      businessHours={data?.businessHours || []}
      slotDuration={data?.settings?.slot_duration_minutes || 30}
      categoryLastBookingTimes={categoryLastBookingTimes}
      onCutoffChange={handleCutoffChange}
      onSave={handleSave}
      isSaving={mutation.isPending}
      saveSuccess={saveSuccess}
    />
  );
}
