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
    mutationFn: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) =>
      bookingsApi.createBooking(salonId, booking),
    onSuccess: invalidateBookings,
  });

  // Update booking
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Booking> }) =>
      bookingsApi.updateBooking(salonId, id, updates),
    onSuccess: (_, variables) => {
      invalidateBookings();
      // 매출 등록/삭제 시 sales 캐시도 무효화
      const bookingMeta = (variables.updates as Record<string, unknown>)?.bookingMeta;
      if (bookingMeta && typeof (bookingMeta as Record<string, unknown>).sales_registered === 'boolean') {
        queryClient.invalidateQueries({ queryKey: ['sales'] });
      }
    },
  });

  // Cancel booking
  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancelBooking(salonId, id),
    onSuccess: invalidateBookings,
  });

  // Complete booking
  const completeMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.completeBooking(salonId, id),
    onSuccess: invalidateBookings,
  });

  // Confirm booking
  const confirmMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.confirmBooking(salonId, id),
    onSuccess: invalidateBookings,
  });

  // Delete booking
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.deleteBooking(salonId, id),
    onSuccess: invalidateBookings,
  });

  const bookings = useMemo(
    () => bookingsQuery.data || [],
    [bookingsQuery.data]
  );

  return useMemo(
    () => ({
      data: bookingsQuery.data,
      bookings,
      isLoading: bookingsQuery.isLoading,
      isFetching: bookingsQuery.isFetching,
      error: bookingsQuery.error,
      refetch: bookingsQuery.refetch,
      createBooking: createMutation.mutateAsync,
      updateBooking: updateMutation.mutateAsync,
      cancelBooking: cancelMutation.mutateAsync,
      completeBooking: completeMutation.mutateAsync,
      confirmBooking: confirmMutation.mutateAsync,
      deleteBooking: deleteMutation.mutateAsync,
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
      bookingsQuery.refetch,
      createMutation.mutateAsync,
      updateMutation.mutateAsync,
      cancelMutation.mutateAsync,
      completeMutation.mutateAsync,
      confirmMutation.mutateAsync,
      deleteMutation.mutateAsync,
      createMutation.isPending,
      updateMutation.isPending,
      cancelMutation.isPending,
      completeMutation.isPending,
      confirmMutation.isPending,
      deleteMutation.isPending,
    ]
  );
};
