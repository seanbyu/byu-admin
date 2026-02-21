'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api';
import { Staff } from '../types';
import { staffKeys, staffQueries } from './queries';
import { ApiResponse } from '@/types';

// ============================================
// useStaff Hook
// - TanStack Query로 직원 데이터 관리
// - Optimistic updates로 빠른 UX 제공
// ============================================

interface UseStaffOptions {
  enabled?: boolean;
}

interface UpdateStaffParams {
  staffId: string;
  updates: Partial<Staff>;
}

type StaffListCache = ApiResponse<Staff[]> | Staff[] | undefined;

const mapStaffListCache = (
  cache: StaffListCache,
  mapper: (list: Staff[]) => Staff[]
): StaffListCache => {
  if (!cache) return cache;

  if (Array.isArray(cache)) {
    return mapper(cache);
  }

  if (Array.isArray(cache.data)) {
    return {
      ...cache,
      data: mapper(cache.data),
    };
  }

  return cache;
};

export function useStaff(salonId: string, options?: UseStaffOptions) {
  const queryClient = useQueryClient();
  const listQueryKey = staffKeys.list(salonId);

  // staffQueries.list()의 select 옵션으로 데이터가 자동 변환됨
  const query = useQuery({
    ...staffQueries.list(salonId),
    enabled: !!salonId && options?.enabled !== false,
  });

  // Mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ staffId, updates }: UpdateStaffParams) =>
      staffApi.update(salonId, staffId, updates),

    // Optimistic update: 서버 응답 전에 UI 먼저 업데이트
    onMutate: async ({ staffId, updates }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: listQueryKey });

      // 이전 데이터 스냅샷
      const previousData = queryClient.getQueryData<StaffListCache>(listQueryKey);

      // 낙관적 업데이트
      queryClient.setQueryData<StaffListCache>(listQueryKey, (old) =>
        mapStaffListCache(old, (list) =>
          list.map((staff) =>
            staff.id === staffId ? { ...staff, ...updates } : staff
          )
        )
      );

      return { previousData };
    },

    // 에러 시 롤백
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(listQueryKey, context.previousData);
      }
    },

    // 성공/실패 후 무효화로 서버 데이터와 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

  // Display order mutation with optimistic updates
  const displayOrderMutation = useMutation({
    mutationFn: (staffOrders: { staffId: string; displayOrder: number }[]) =>
      staffApi.updateDisplayOrder(salonId, staffOrders),

    // Optimistic update
    onMutate: async (staffOrders) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousData = queryClient.getQueryData<StaffListCache>(listQueryKey);

      queryClient.setQueryData<StaffListCache>(listQueryKey, (old) =>
        mapStaffListCache(old, (list) => {
          const orderMap = new Map(staffOrders.map((o) => [o.staffId, o.displayOrder]));
          return list
            .map((staff) => ({
              ...staff,
              displayOrder: orderMap.get(staff.id) ?? staff.displayOrder,
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder);
        })
      );

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(listQueryKey, context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

  // Stable callback references
  const updateStaff = useCallback(
    (params: UpdateStaffParams) => updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const updateDisplayOrder = useCallback(
    (staffOrders: { staffId: string; displayOrder: number }[]) =>
      displayOrderMutation.mutateAsync(staffOrders),
    [displayOrderMutation]
  );

  const refetch = useCallback(() => query.refetch(), [query]);

  return {
    // Data
    staffData: query.data ?? [],
    rawResponse: queryClient.getQueryData<StaffListCache>(listQueryKey),

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    refetch,
    updateStaff,
    updateDisplayOrder,
    isUpdating: updateMutation.isPending,
    isUpdatingOrder: displayOrderMutation.isPending,
  };
}

// Type export for external use
export type UseStaffReturn = ReturnType<typeof useStaff>;
