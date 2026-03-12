'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionApi } from '../api';
import { CreatePositionDto, UpdatePositionDto, StaffPosition } from '../types';
import { positionKeys, positionQueries } from './queries';

// ============================================
// useStaffPositions Hook
// - TanStack Query로 직급 데이터 관리
// - CRUD 작업에 대한 optimistic updates
// ============================================

interface UseStaffPositionsOptions {
  enabled?: boolean;
}

interface UpdatePositionParams {
  positionId: string;
  dto: UpdatePositionDto;
}

export function useStaffPositions(
  salonId: string,
  options?: UseStaffPositionsOptions
) {
  const queryClient = useQueryClient();
  const queryKey = positionKeys.list(salonId);

  // Query with auto-transformed data via select
  const query = useQuery({
    ...positionQueries.list(salonId),
    enabled: options?.enabled !== false && !!salonId,
  });

  // Helper: invalidate positions
  const invalidatePositions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (dto: CreatePositionDto) => positionApi.create(salonId, dto),
    retry: 0,

    onMutate: async (newPosition) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistic: 임시 ID로 추가
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        const tempPosition: StaffPosition = {
          id: `temp-${Date.now()}`,
          salonId,
          ...newPosition,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [...old, tempPosition];
      });

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    onSettled: invalidatePositions,
  });

  // Update mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ positionId, dto }: UpdatePositionParams) =>
      positionApi.update(positionId, dto),
    retry: 0,

    onMutate: async ({ positionId, dto }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((pos) =>
          pos.id === positionId
            ? { ...pos, ...dto, updatedAt: new Date() }
            : pos
        );
      });

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    onSettled: invalidatePositions,
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: (positionId: string) => positionApi.delete(positionId),
    retry: 0,

    onMutate: async (positionId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((pos) => pos.id !== positionId);
      });

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    onSettled: invalidatePositions,
  });

  // Stable callback references
  const createPosition = useCallback(
    (dto: CreatePositionDto) => createMutation.mutateAsync(dto),
    [createMutation]
  );

  const updatePosition = useCallback(
    (params: UpdatePositionParams) => updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const deletePosition = useCallback(
    (positionId: string) => deleteMutation.mutateAsync(positionId),
    [deleteMutation]
  );

  const refetch = useCallback(() => query.refetch(), [query]);

  return {
    // Data
    positions: query.data ?? [],

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    refetch,
    createPosition,
    updatePosition,
    deletePosition,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Type export for external use
export type UseStaffPositionsReturn = ReturnType<typeof useStaffPositions>;
