'use client';

// ============================================
// TanStack Query Keys & Options for Salons
// ============================================

export const salonKeys = {
  all: ['salons'] as const,
  lists: () => [...salonKeys.all, 'list'] as const,
  list: (params?: unknown) => [...salonKeys.lists(), params] as const,
  details: () => [...salonKeys.all, 'detail'] as const,
  detail: (salonId: string) => [...salonKeys.details(), salonId] as const,
  sales: (salonId: string, params?: unknown) =>
    [...salonKeys.detail(salonId), 'sales', params] as const,
  settings: (salonId: string) =>
    [...salonKeys.detail(salonId), 'settings'] as const,
};

export const SALONS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5분
  gcTime: 1000 * 60 * 30, // 30분
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const SALON_SALES_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 2, // 2분 (매출은 자주 갱신)
  gcTime: 1000 * 60 * 15, // 15분
  refetchOnWindowFocus: true,
  retry: 2,
} as const;
