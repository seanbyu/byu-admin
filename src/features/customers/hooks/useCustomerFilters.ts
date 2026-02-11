'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { customerApi } from '../api';
import type {
  CustomFilter,
  CreateCustomFilterDto,
  UpdateCustomFilterDto,
} from '../types/filter.types';

// ============================================
// Query Keys
// ============================================

export const customerFilterKeys = {
  all: ['customer-filters'] as const,
  list: (salonId: string) => [...customerFilterKeys.all, 'list', salonId] as const,
};

// ============================================
// useCustomerFilters Hook
// ============================================

export function useCustomerFilters(salonId: string) {
  const queryClient = useQueryClient();

  // 필터 목록 조회
  const filtersQuery = useQuery({
    queryKey: customerFilterKeys.list(salonId),
    queryFn: () => customerApi.getFilters(salonId),
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000, // 5분
    retry: false, // 테이블이 없을 때 반복 요청 방지
    select: (response) => response.data || [],
  });

  // 필터 생성
  const createMutation = useMutation({
    mutationFn: (dto: CreateCustomFilterDto) =>
      customerApi.createFilter(salonId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerFilterKeys.list(salonId) });
    },
  });

  // 필터 수정
  const updateMutation = useMutation({
    mutationFn: ({ filterId, updates }: { filterId: string; updates: UpdateCustomFilterDto }) =>
      customerApi.updateFilter(salonId, filterId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerFilterKeys.list(salonId) });
    },
  });

  // 필터 삭제
  const deleteMutation = useMutation({
    mutationFn: (filterId: string) =>
      customerApi.deleteFilter(salonId, filterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerFilterKeys.list(salonId) });
    },
  });

  // 필터 순서 변경
  const reorderMutation = useMutation({
    mutationFn: (filters: { id: string; display_order: number }[]) =>
      customerApi.reorderFilters(salonId, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerFilterKeys.list(salonId) });
    },
  });

  // Convenience methods
  const createFilter = useCallback(
    async (dto: CreateCustomFilterDto) => {
      return createMutation.mutateAsync(dto);
    },
    [createMutation]
  );

  const updateFilter = useCallback(
    async (filterId: string, updates: UpdateCustomFilterDto) => {
      return updateMutation.mutateAsync({ filterId, updates });
    },
    [updateMutation]
  );

  const deleteFilter = useCallback(
    async (filterId: string) => {
      return deleteMutation.mutateAsync(filterId);
    },
    [deleteMutation]
  );

  const reorderFilters = useCallback(
    async (filters: CustomFilter[]) => {
      const order = filters.map((f, idx) => ({
        id: f.id,
        display_order: idx,
      }));
      return reorderMutation.mutateAsync(order);
    },
    [reorderMutation]
  );

  return {
    // Data
    filters: filtersQuery.data || [],
    isLoading: filtersQuery.isLoading,
    error: filtersQuery.error,

    // Mutations
    createFilter,
    isCreating: createMutation.isPending,

    updateFilter,
    isUpdating: updateMutation.isPending,

    deleteFilter,
    isDeleting: deleteMutation.isPending,

    reorderFilters,
    isReordering: reorderMutation.isPending,

    // Refetch
    refetch: filtersQuery.refetch,
  };
}
