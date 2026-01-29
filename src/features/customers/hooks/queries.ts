'use client';

// ============================================
// TanStack Query Keys & Options for Customers
// ============================================

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (salonId: string) => [...customerKeys.lists(), salonId] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (customerId: string) => [...customerKeys.details(), customerId] as const,
};

export const CUSTOMERS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5분
  gcTime: 1000 * 60 * 30, // 30분
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
