'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBookingsApi } from '../api';
import { Booking } from '../types';
import { bookingKeys, BOOKINGS_QUERY_OPTIONS } from './queries';

const bookingsApi = createBookingsApi();

interface UseBookingsOptions {
  enabled?: boolean;
}

export const useBookings = (salonId: string, options?: UseBookingsOptions) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => bookingKeys.list(salonId), [salonId]);

  // Fetch bookings
  const bookingsQuery = useQuery<Booking[]>({
    queryKey,
    queryFn: async () => {
      const response = await bookingsApi.getBookings(salonId);
      if (!response.data) throw new Error('No data received');
      return response.data as Booking[];
    },
    enabled: !!salonId && options?.enabled !== false,
    ...BOOKINGS_QUERY_OPTIONS,
  });

  // Invalidate helper — invalidate + force immediate refetch
  const invalidateBookings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey, type: 'active' });
  }, [queryClient, queryKey]);

  // Create booking
  const createMutation = useMutation({
    mutationFn: useCallback(
      (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) =>
        bookingsApi.createBooking(salonId, booking),
      [salonId]
    ),
    onSuccess: invalidateBookings,
  });

  // Update booking
  const updateMutation = useMutation({
    mutationFn: useCallback(
      ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
        bookingsApi.updateBooking(salonId, id, updates),
      [salonId]
    ),
    onSuccess: invalidateBookings,
  });

  // Cancel booking
  const cancelMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => bookingsApi.cancelBooking(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateBookings,
  });

  // Complete booking
  const completeMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => bookingsApi.completeBooking(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateBookings,
  });

  // Confirm booking
  const confirmMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => bookingsApi.confirmBooking(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateBookings,
  });

  // Delete booking
  const deleteMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => bookingsApi.deleteBooking(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateBookings,
  });

  // Memoized data
  const bookings = useMemo(
    () => bookingsQuery.data || [],
    [bookingsQuery.data]
  );

  // Memoized mutation functions
  const createBooking = useCallback(
    (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) =>
      createMutation.mutateAsync(booking),
    [createMutation]
  );

  const updateBooking = useCallback(
    (params: { id: string; updates: Partial<Booking> }) =>
      updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const cancelBooking = useCallback(
    (id: string) => cancelMutation.mutateAsync(id),
    [cancelMutation]
  );

  const completeBooking = useCallback(
    (id: string) => completeMutation.mutateAsync(id),
    [completeMutation]
  );

  const confirmBooking = useCallback(
    (id: string) => confirmMutation.mutateAsync(id),
    [confirmMutation]
  );

  const deleteBooking = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  const refetch = useCallback(() => bookingsQuery.refetch(), [bookingsQuery]);

  return useMemo(
    () => ({
      data: bookingsQuery.data,
      bookings,
      isLoading: bookingsQuery.isLoading,
      isFetching: bookingsQuery.isFetching,
      error: bookingsQuery.error,
      refetch,
      createBooking,
      updateBooking,
      cancelBooking,
      completeBooking,
      confirmBooking,
      deleteBooking,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isCancelling: cancelMutation.isPending,
      isCompleting: completeMutation.isPending,
      isConfirming: confirmMutation.isPending,
      isDeleting: deleteMutation.isPending,
    }),
    [
      bookingsQuery.data,
      bookings,
      bookingsQuery.isLoading,
      bookingsQuery.isFetching,
      bookingsQuery.error,
      refetch,
      createBooking,
      updateBooking,
      cancelBooking,
      completeBooking,
      confirmBooking,
      deleteBooking,
      createMutation.isPending,
      updateMutation.isPending,
      cancelMutation.isPending,
      completeMutation.isPending,
      confirmMutation.isPending,
      deleteMutation.isPending,
    ]
  );
};
