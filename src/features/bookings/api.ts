import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse, Booking } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export const createBookingsApi = (client?: SupabaseClient<any>) => {
  return {
    getBookings: (salonId: string): Promise<ApiResponse<Booking[]>> =>
      apiClient.get(endpoints.salons.bookings.path(salonId)),

    createBooking: (
      salonId: string,
      booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
    ) =>
      apiClient.post(endpoints.salons.bookings.path(salonId), {
        action: 'create_booking', // Or just body if I kept default behavior, but I added action switch
        ...booking,
      }),

    updateBooking: (salonId: string, id: string, updates: Partial<Booking>) =>
      apiClient.post(endpoints.salons.bookings.path(salonId), {
        action: 'update_booking',
        id,
        updates,
      }),

    cancelBooking: (salonId: string, id: string) =>
      apiClient.post(endpoints.salons.bookings.path(salonId), {
        action: 'cancel_booking',
        id,
      }),

    completeBooking: (salonId: string, id: string) =>
      apiClient.post(endpoints.salons.bookings.path(salonId), {
        action: 'complete_booking',
        id,
      }),
  };
};
