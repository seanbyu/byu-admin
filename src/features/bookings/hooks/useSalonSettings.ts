'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salonsApi } from '@/features/salons/api';
import { salonSettingsKeys, SALON_SETTINGS_QUERY_OPTIONS } from './queries';
import { BusinessHours, Holiday } from '@/types';
import { SupportedLanguage } from '../constants';

// ============================================
// Salon Settings Types
// ============================================

// Contact Channel Settings
export interface ContactChannel {
  enabled: boolean;
  id: string; // LINE ID 또는 Instagram username
}

export interface ContactChannels {
  line?: ContactChannel;
  instagram?: ContactChannel;
}

export interface SalonSettings {
  slot_duration_minutes?: number;
  booking_advance_days?: number;
  booking_cancellation_hours?: number;
  interpreter_enabled?: boolean;
  supported_languages?: SupportedLanguage[];
  contact_channels?: ContactChannels;
  category_last_booking_times?: Record<string, string>;
}

export interface SalonSettingsData {
  businessHours: BusinessHours[];
  holidays: Holiday[];
  settings: SalonSettings;
}

// ============================================
// useSalonSettings Hook
// - Fetches salon settings using TanStack Query
// ============================================

export function useSalonSettings(salonId: string) {
  return useQuery({
    queryKey: salonSettingsKeys.detail(salonId),
    queryFn: async () => {
      const response = await salonsApi.getSettings(salonId);
      if (!response.success) {
        throw new Error('Failed to fetch salon settings');
      }
      return response.data as SalonSettingsData;
    },
    enabled: !!salonId,
    ...SALON_SETTINGS_QUERY_OPTIONS,
  });
}

// ============================================
// useSalonSettingsMutation Hook
// - Updates salon settings with cache invalidation
// ============================================

interface UpdateSettingsInput {
  businessHours?: BusinessHours[];
  holidays?: Holiday[];
  settings?: Partial<SalonSettings>;
}

export function useSalonSettingsMutation(salonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsInput) => {
      const response = await salonsApi.updateSettings(salonId, data);
      if (!response.success) {
        throw new Error('Failed to update salon settings');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: salonSettingsKeys.detail(salonId),
      });
    },
  });
}

// ============================================
// Specialized Mutation Hooks
// ============================================

// Business hours mutation
export function useBusinessHoursMutation(salonId: string) {
  const mutation = useSalonSettingsMutation(salonId);

  return {
    ...mutation,
    mutateBusinessHours: (
      businessHours: BusinessHours[],
      slotDuration: number,
      bookingAdvanceDays: number,
      cancellationHours?: number
    ) =>
      mutation.mutateAsync({
        businessHours,
        settings: {
          slot_duration_minutes: slotDuration,
          booking_advance_days: bookingAdvanceDays,
          ...(cancellationHours !== undefined && { booking_cancellation_hours: cancellationHours }),
        },
      }),
  };
}

// Holidays mutation
export function useHolidaysMutation(salonId: string) {
  const mutation = useSalonSettingsMutation(salonId);

  return {
    ...mutation,
    mutateHolidays: (holidays: Holiday[]) =>
      mutation.mutateAsync({ holidays }),
  };
}

// Interpreter settings mutation
export function useInterpreterSettingsMutation(salonId: string) {
  const mutation = useSalonSettingsMutation(salonId);

  return {
    ...mutation,
    mutateInterpreterSettings: (
      interpreterEnabled: boolean,
      supportedLanguages: SupportedLanguage[]
    ) =>
      mutation.mutateAsync({
        settings: {
          interpreter_enabled: interpreterEnabled,
          supported_languages: supportedLanguages,
        },
      }),
  };
}

// Category last booking times mutation
export function useCategoryLastBookingMutation(salonId: string) {
  const mutation = useSalonSettingsMutation(salonId);

  return {
    ...mutation,
    mutateCategoryLastBookingTimes: (times: Record<string, string>) =>
      mutation.mutateAsync({
        settings: {
          category_last_booking_times: times,
        },
      }),
  };
}

// Contact channels mutation
export function useContactChannelsMutation(salonId: string) {
  const mutation = useSalonSettingsMutation(salonId);

  return {
    ...mutation,
    mutateContactChannels: (contactChannels: ContactChannels) =>
      mutation.mutateAsync({
        settings: {
          contact_channels: contactChannels,
        },
      }),
  };
}
