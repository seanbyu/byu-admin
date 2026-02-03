'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api';
import { Staff } from '../types';
import { staffKeys, staffQueries } from './queries';

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

export function useStaff(salonId: string, options?: UseStaffOptions) {
  const queryClient = useQueryClient();

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
      await queryClient.cancelQueries({ queryKey: staffKeys.list(salonId) });

      // 이전 데이터 스냅샷
      const previousData = queryClient.getQueryData(staffKeys.list(salonId));

      // 낙관적 업데이트
      queryClient.setQueryData(staffKeys.list(salonId), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((staff: Staff) =>
            staff.id === staffId ? { ...staff, ...updates } : staff
          ),
        };
      });

      return { previousData };
    },

    // 에러 시 롤백
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(staffKeys.list(salonId), context.previousData);
      }
    },

    // 성공/실패 후 무효화로 서버 데이터와 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list(salonId) });
    },
  });

  // Stable callback references
  const updateStaff = useCallback(
    (params: UpdateStaffParams) => updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const refetch = useCallback(() => query.refetch(), [query]);

  return {
    // Data
    staffData: query.data ?? [],
    rawResponse: queryClient.getQueryData(staffKeys.list(salonId)),

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Actions
    refetch,
    updateStaff,
    isUpdating: updateMutation.isPending,
  };
}

// Type export for external use
export type UseStaffReturn = ReturnType<typeof useStaff>;
