'use client';

import { queryOptions } from '@tanstack/react-query';
import { customerApi } from '../api';
import type {
  CustomerListItem,
  GetCustomersParams,
  GetCustomersResponse,
  GetCustomerChartResponse,
} from '../types';
import type { ApiResponse } from '@/types';

// ============================================
// Query Key Factory
// - 일관된 캐시 키 관리
// - 계층 구조로 선택적 무효화 가능
// - client-swr-dedup: TanStack Query가 자동 중복 제거
// ============================================

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: GetCustomersParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (salonId: string, customerId: string) =>
    [...customerKeys.details(), salonId, customerId] as const,
  charts: () => [...customerKeys.all, 'chart'] as const,
  chart: (salonId: string, customerId: string) =>
    [...customerKeys.charts(), salonId, customerId] as const,
  histories: () => [...customerKeys.all, 'history'] as const,
  history: (salonId: string, customerId: string, limit?: number) =>
    [...customerKeys.histories(), salonId, customerId, limit] as const,
};

// ============================================
// Default Query Options
// ============================================

export const CUSTOMER_STALE_TIME = 1000 * 60 * 5; // 5분
export const CUSTOMER_GC_TIME = 1000 * 60 * 30; // 30분
export const CUSTOMER_CHART_STALE_TIME = 1000 * 60 * 3; // 3분 (차트는 더 자주 갱신)
export const CUSTOMER_CHART_GC_TIME = 1000 * 60 * 15; // 15분

// ============================================
// Query Options Factory (TanStack Query v5)
// - queryOptions()로 타입 안전한 쿼리 정의
// - 컴포넌트에서 직접 사용 가능
// - async-parallel: select에서 변환하여 추가 처리 불필요
// ============================================

export const customerQueries = {
  /**
   * 고객 목록 조회
   * - 필터, 정렬, 검색 파라미터 지원
   * - select로 data 직접 추출
   */
  list: (params: GetCustomersParams) =>
    queryOptions({
      queryKey: customerKeys.list(params),
      queryFn: () => customerApi.getList(params),
      staleTime: CUSTOMER_STALE_TIME,
      gcTime: CUSTOMER_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!params.salon_id,
      // server-serialization: 필요한 데이터만 추출
      select: (response: ApiResponse<GetCustomersResponse>) => ({
        customers: response.data?.data || [],
        total: response.data?.total || 0,
        page: response.data?.page || 1,
        limit: response.data?.limit || 50,
      }),
    }),

  /**
   * 고객 상세 정보 조회
   */
  detail: (salonId: string, customerId: string) =>
    queryOptions({
      queryKey: customerKeys.detail(salonId, customerId),
      queryFn: () => customerApi.getById(salonId, customerId),
      staleTime: CUSTOMER_STALE_TIME,
      gcTime: CUSTOMER_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!salonId && !!customerId,
      select: (response: ApiResponse<CustomerListItem>) => response.data,
    }),

  /**
   * 고객 차트 (상세 + 시술 이력)
   * - async-parallel: 서버에서 병렬 처리
   */
  chart: (salonId: string, customerId: string) =>
    queryOptions({
      queryKey: customerKeys.chart(salonId, customerId),
      queryFn: () => customerApi.getChart(salonId, customerId),
      staleTime: CUSTOMER_CHART_STALE_TIME,
      gcTime: CUSTOMER_CHART_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!salonId && !!customerId,
      select: (response: ApiResponse<GetCustomerChartResponse>) => response.data?.data,
    }),

  /**
   * 고객 시술 이력만 조회
   */
  history: (salonId: string, customerId: string, limit = 10) =>
    queryOptions({
      queryKey: customerKeys.history(salonId, customerId, limit),
      queryFn: () => customerApi.getHistory(salonId, customerId, limit),
      staleTime: CUSTOMER_CHART_STALE_TIME,
      gcTime: CUSTOMER_CHART_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 2,
      enabled: !!salonId && !!customerId,
      select: (response: ApiResponse<any>) => response.data || [],
    }),
};
