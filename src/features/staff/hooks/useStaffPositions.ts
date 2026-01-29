'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffPositionApi } from '../api';
import { CreatePositionDto, UpdatePositionDto } from '../types';
import { positionKeys, POSITION_QUERY_OPTIONS } from './queries';

interface UseStaffPositionsOptions {
  enabled?: boolean;
}

export function useStaffPositions(salonId: string, options?: UseStaffPositionsOptions) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => positionKeys.list(salonId), [salonId]);

  // Fetch positions
  const positionsQuery = useQuery({
    queryKey,
    queryFn: () => staffPositionApi.getPositions(salonId),
    enabled: options?.enabled !== false && !!salonId,
    ...POSITION_QUERY_OPTIONS,
  });

  // Invalidate helper
  const invalidatePositions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Create position
  const createMutation = useMutation({
    mutationFn: useCallback(
      (dto: CreatePositionDto) => staffPositionApi.createPosition(salonId, dto),
      [salonId]
    ),
    onSuccess: invalidatePositions,
  });

  // Update position
  const updateMutation = useMutation({
    mutationFn: useCallback(
      ({ positionId, dto }: { positionId: string; dto: UpdatePositionDto }) =>
        staffPositionApi.updatePosition(positionId, dto),
      []
    ),
    onSuccess: invalidatePositions,
  });

  // Delete position
  const deleteMutation = useMutation({
    mutationFn: useCallback(
      (positionId: string) => staffPositionApi.deletePosition(positionId),
      []
    ),
    onSuccess: invalidatePositions,
  });

  // Memoized data
  const positions = useMemo(
    () => positionsQuery.data?.data || [],
    [positionsQuery.data?.data]
  );

  // Memoized mutation functions
  const createPosition = useCallback(
    (dto: CreatePositionDto) => createMutation.mutateAsync(dto),
    [createMutation]
  );

  const updatePosition = useCallback(
    (params: { positionId: string; dto: UpdatePositionDto }) =>
      updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const deletePosition = useCallback(
    (positionId: string) => deleteMutation.mutateAsync(positionId),
    [deleteMutation]
  );

  const refetch = useCallback(() => positionsQuery.refetch(), [positionsQuery]);

  return useMemo(
    () => ({
      positions,
      isLoading: positionsQuery.isLoading,
      isFetching: positionsQuery.isFetching,
      error: positionsQuery.data?.error || positionsQuery.error,
      refetch,
      createPosition,
      updatePosition,
      deletePosition,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
    }),
    [
      positions,
      positionsQuery.isLoading,
      positionsQuery.isFetching,
      positionsQuery.data?.error,
      positionsQuery.error,
      refetch,
      createPosition,
      updatePosition,
      deletePosition,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
    ]
  );
}
