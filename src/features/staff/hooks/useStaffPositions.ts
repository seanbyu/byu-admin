'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffPositionApi } from '../api';
import { StaffPosition, CreatePositionDto, UpdatePositionDto } from '../types';

const POSITIONS_QUERY_KEY = 'staff-positions';

export function useStaffPositions(salonId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  // Fetch positions
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [POSITIONS_QUERY_KEY, salonId],
    queryFn: () => staffPositionApi.getPositions(salonId),
    enabled: options?.enabled !== false && !!salonId,
  });

  // Create position
  const createMutation = useMutation({
    mutationFn: (dto: CreatePositionDto) =>
      staffPositionApi.createPosition(salonId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY, salonId] });
    },
  });

  // Update position
  const updateMutation = useMutation({
    mutationFn: ({ positionId, dto }: { positionId: string; dto: UpdatePositionDto }) =>
      staffPositionApi.updatePosition(positionId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY, salonId] });
    },
  });

  // Delete position
  const deleteMutation = useMutation({
    mutationFn: (positionId: string) => staffPositionApi.deletePosition(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSITIONS_QUERY_KEY, salonId] });
    },
  });

  return {
    positions: response?.data || [],
    isLoading,
    error: response?.error || error,
    refetch,
    createPosition: createMutation.mutateAsync,
    updatePosition: updateMutation.mutateAsync,
    deletePosition: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
