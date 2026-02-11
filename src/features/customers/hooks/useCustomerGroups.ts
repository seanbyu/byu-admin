'use client';

import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../api';

// ============================================
// Query Keys
// ============================================

export const customerGroupKeys = {
  all: ['customer-groups'] as const,
  list: (salonId: string) => [...customerGroupKeys.all, 'list', salonId] as const,
};

// ============================================
// useCustomerGroups Hook
// ============================================

export function useCustomerGroups(salonId: string) {
  const groupsQuery = useQuery({
    queryKey: customerGroupKeys.list(salonId),
    queryFn: () => customerApi.getGroups(salonId),
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000, // 5분
    retry: false,
    select: (response) => response.data || [],
  });

  return {
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    error: groupsQuery.error,
    refetch: groupsQuery.refetch,
  };
}
