'use client';

import { queryOptions } from '@tanstack/react-query';
import { staffApi, positionApi } from '../api';
import { Staff, StaffPosition } from '../types';
import { ApiResponse } from '@/types';

// ============================================
// Query Key Factory
// - 일관된 캐시 키 관리
// - 계층 구조로 선택적 무효화 가능
// ============================================

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (salonId: string) => [...staffKeys.lists(), salonId] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (salonId: string, staffId: string) =>
    [...staffKeys.details(), salonId, staffId] as const,
};

export const positionKeys = {
  all: ['staff-positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (salonId: string) => [...positionKeys.lists(), salonId] as const,
};

// ============================================
// Default Query Options
// ============================================

export const STAFF_STALE_TIME = 1000 * 60 * 5; // 5분
export const STAFF_GC_TIME = 1000 * 60 * 30; // 30분
export const POSITION_STALE_TIME = 1000 * 60 * 10; // 10분
export const POSITION_GC_TIME = 1000 * 60 * 60; // 1시간

// Legacy exports for backward compatibility
export const STAFF_QUERY_OPTIONS = {
  staleTime: STAFF_STALE_TIME,
  gcTime: STAFF_GC_TIME,
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const POSITION_QUERY_OPTIONS = {
  staleTime: POSITION_STALE_TIME,
  gcTime: POSITION_GC_TIME,
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

// ============================================
// Query Options Factory (TanStack Query v5)
// - queryOptions()로 타입 안전한 쿼리 정의
// - 컴포넌트에서 직접 사용 가능
// ============================================

export const staffQueries = {
  list: (salonId: string) =>
    queryOptions({
      queryKey: staffKeys.list(salonId),
      queryFn: () => staffApi.getList(salonId),
      staleTime: STAFF_STALE_TIME,
      gcTime: STAFF_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!salonId,
      select: (response: ApiResponse<Staff[]>) => response.data || [],
    }),

  detail: (salonId: string, staffId: string) =>
    queryOptions({
      queryKey: staffKeys.detail(salonId, staffId),
      queryFn: () => staffApi.getById(salonId, staffId),
      staleTime: STAFF_STALE_TIME,
      gcTime: STAFF_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!salonId && !!staffId,
      select: (response: ApiResponse<Staff>) => response.data,
    }),
};

export const positionQueries = {
  list: (salonId: string) =>
    queryOptions({
      queryKey: positionKeys.list(salonId),
      queryFn: () => positionApi.getList(salonId),
      staleTime: POSITION_STALE_TIME,
      gcTime: POSITION_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!salonId,
      select: (response: ApiResponse<StaffPosition[]>) => response.data || [],
    }),
};
