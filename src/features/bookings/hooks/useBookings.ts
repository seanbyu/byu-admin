import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBookingsApi } from '../api';
import { supabase } from '@/lib/supabase/client';

const bookingsApi = createBookingsApi(supabase);
import { Booking } from '../types';

export const useBookings = (
  salonId: string,
  options?: { enabled?: boolean }
) => {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery<Booking[]>({
    queryKey: ['bookings', salonId],
    queryFn: async () => {
      const response = await bookingsApi.getBookings(salonId);
      if (!response.data) throw new Error('No data received');
      return response.data as Booking[];
    },
    enabled: !!salonId && options?.enabled,
  });

  const createBookingMutation = useMutation({
    mutationFn: ({
      booking,
    }: {
      booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
    }) => bookingsApi.createBooking(salonId, booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', salonId] });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
      bookingsApi.updateBooking(salonId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', salonId] });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancelBooking(salonId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', salonId] });
    },
  });

  const completeBookingMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.completeBooking(salonId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', salonId] });
    },
  });

  return {
    ...bookingsQuery,
    createBooking: createBookingMutation.mutateAsync,
    isCreating: createBookingMutation.isPending,
    updateBooking: updateBookingMutation.mutateAsync,
    cancelBooking: cancelBookingMutation.mutateAsync,
    completeBooking: completeBookingMutation.mutateAsync,
  };
};
