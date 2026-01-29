'use client';

// ============================================
// TanStack Query Keys & Options
// - Query key 상수화로 일관성 유지
// - staleTime, gcTime 설정으로 캐싱 최적화
// ============================================

// Query Keys Factory
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (salonId: string) => [...staffKeys.lists(), salonId] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (staffId: string) => [...staffKeys.details(), staffId] as const,
};

export const positionKeys = {
  all: ['staff-positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (salonId: string) => [...positionKeys.lists(), salonId] as const,
};

// Default Query Options
export const STAFF_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5분 동안 fresh
  gcTime: 1000 * 60 * 30, // 30분 동안 캐시 유지
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const POSITION_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 10, // 10분 동안 fresh (positions는 자주 안 바뀜)
  gcTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
