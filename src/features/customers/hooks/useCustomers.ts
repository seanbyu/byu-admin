'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../api';
import { customerKeys, customerQueries } from './queries';
import type {
  CustomerListItem,
  GetCustomersParams,
  CreateCustomerDto,
  UpdateCustomerDto,
} from '../types';

// ============================================
// useCustomers Hook
// - TanStack Query로 고객 데이터 관리
// - Optimistic updates로 빠른 UX 제공
// - rerender-memo: 안정적인 참조를 위해 useCallback/useMemo 사용
// ============================================

interface UseCustomersOptions {
  enabled?: boolean;
}

interface UpdateCustomerParams {
  customerId: string;
  updates: UpdateCustomerDto;
}

export function useCustomers(params: GetCustomersParams, options?: UseCustomersOptions) {
  const queryClient = useQueryClient();

  // customerQueries.list()의 select 옵션으로 데이터가 자동 변환됨
  // client-swr-dedup: TanStack Query가 자동으로 중복 요청 제거
  const query = useQuery({
    ...customerQueries.list(params),
    enabled: !!params.salon_id && options?.enabled !== false,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateCustomerDto) => customerApi.create(params.salon_id, dto),

    // 성공 시 목록 무효화
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });

  // Update mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ customerId, updates }: UpdateCustomerParams) =>
      customerApi.update(params.salon_id, customerId, updates),

    // Optimistic update: 서버 응답 전에 UI 먼저 업데이트
    onMutate: async ({ customerId, updates }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: customerKeys.list(params) });

      // 이전 데이터 스냅샷
      const previousData = queryClient.getQueryData(customerKeys.list(params));

      // 낙관적 업데이트
      queryClient.setQueryData(customerKeys.list(params), (old: any) => {
        if (!old?.customers) return old;
        return {
          ...old,
          customers: old.customers.map((customer: CustomerListItem) =>
            customer.id === customerId ? { ...customer, ...updates } : customer
          ),
        };
      });

      return { previousData };
    },

    // 에러 시 롤백
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(customerKeys.list(params), context.previousData);
      }
    },

    // 성공/실패 후 무효화로 서버 데이터와 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (customerId: string) =>
      customerApi.delete(params.salon_id, customerId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });

  // rerender-functional-setstate: 안정적인 콜백을 위해 useCallback 사용
  const createCustomer = useCallback(
    (dto: CreateCustomerDto) => createMutation.mutateAsync(dto),
    [createMutation]
  );

  const updateCustomer = useCallback(
    (updateParams: UpdateCustomerParams) => updateMutation.mutateAsync(updateParams),
    [updateMutation]
  );

  const deleteCustomer = useCallback(
    (customerId: string) => deleteMutation.mutateAsync(customerId),
    [deleteMutation]
  );

  const refetch = useCallback(() => query.refetch(), [query]);

  // rerender-memo: 반환 객체를 useMemo로 최적화
  return useMemo(
    () => ({
      // Data
      customers: query.data?.customers ?? [],
      total: query.data?.total ?? 0,
      page: query.data?.page ?? 1,
      limit: query.data?.limit ?? 50,

      // Query state
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,

      // Actions
      refetch,
      createCustomer,
      updateCustomer,
      deleteCustomer,

      // Mutation states
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
    }),
    [
      query.data,
      query.isLoading,
      query.isFetching,
      query.error,
      refetch,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
    ]
  );
}

// Type export for external use
export type UseCustomersReturn = ReturnType<typeof useCustomers>;
