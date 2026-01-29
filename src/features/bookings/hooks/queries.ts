'use client';

// ============================================
// TanStack Query Keys & Options for Bookings
// - Query key 상수화로 일관성 유지
// - staleTime, gcTime 설정으로 캐싱 최적화
// ============================================

// Query Keys Factory
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (salonId: string) => [...bookingKeys.lists(), salonId] as const,
  listFiltered: (salonId: string, filters: Record<string, unknown>) =>
    [...bookingKeys.list(salonId), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (bookingId: string) => [...bookingKeys.details(), bookingId] as const,
};

export const salonSettingsKeys = {
  all: ['salon-settings'] as const,
  detail: (salonId: string) => [...salonSettingsKeys.all, salonId] as const,
};

// Default Query Options
export const BOOKINGS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 2, // 2분 동안 fresh (예약은 자주 변경됨)
  gcTime: 1000 * 60 * 15, // 15분 동안 캐시 유지
  refetchOnWindowFocus: true, // 예약은 실시간성이 중요
  retry: 2,
} as const;

export const SALON_SETTINGS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 10, // 10분 동안 fresh
  gcTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
