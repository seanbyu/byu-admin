'use client';

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse } from '@/types';
import type {
  CustomerListItem,
  GetCustomersParams,
  GetCustomersResponse,
  GetCustomerChartResponse,
  CreateCustomerDto,
  UpdateCustomerDto,
} from './types';

// ============================================
// Customer API Functions
// - 순수 함수로 API 호출만 담당
// - TanStack Query의 queryFn으로 직접 사용 가능
// - bundle-barrel-imports: 직접 import하여 tree-shaking 최적화
// ============================================

export const customerApi = {
  // GET: 고객 목록 조회
  // async-parallel: 서버에서 병렬 처리되도록 단일 요청으로 구성
  getList: async (
    params: GetCustomersParams
  ): Promise<ApiResponse<GetCustomersResponse>> => {
    const queryParams = new URLSearchParams();

    if (params.filter) queryParams.append('filter', params.filter);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `${endpoints.salons.customers.path(params.salon_id)}?${queryParams.toString()}`;
    return apiClient.get(url);
  },

  // GET: 고객 상세 정보 조회
  getById: async (
    salonId: string,
    customerId: string
  ): Promise<ApiResponse<CustomerListItem>> => {
    return apiClient.get(`${endpoints.salons.customers.path(salonId)}/${customerId}`);
  },

  // GET: 고객 차트 (상세 + 시술 이력)
  // async-parallel: 내부적으로 Promise.all로 병렬 조회
  getChart: async (
    salonId: string,
    customerId: string
  ): Promise<ApiResponse<GetCustomerChartResponse>> => {
    return apiClient.get(
      `${endpoints.salons.customers.path(salonId)}/${customerId}/chart`
    );
  },

  // GET: 고객 시술 이력
  getHistory: async (
    salonId: string,
    customerId: string,
    limit = 10
  ): Promise<ApiResponse<any>> => {
    return apiClient.get(
      `${endpoints.salons.customers.path(salonId)}/${customerId}/history?limit=${limit}`
    );
  },

  // POST: 고객 생성
  create: async (
    salonId: string,
    dto: CreateCustomerDto
  ): Promise<ApiResponse<CustomerListItem>> => {
    return apiClient.post(endpoints.salons.customers.path(salonId), {
      action: 'create_customer',
      ...dto,
    });
  },

  // POST: 고객 정보 수정
  update: async (
    salonId: string,
    customerId: string,
    dto: UpdateCustomerDto
  ): Promise<ApiResponse<CustomerListItem>> => {
    return apiClient.post(endpoints.salons.customers.path(salonId), {
      action: 'update_customer',
      id: customerId,
      updates: dto,
    });
  },

  // POST: 고객 삭제
  delete: async (
    salonId: string,
    customerId: string
  ): Promise<ApiResponse<void>> => {
    return apiClient.post(endpoints.salons.customers.path(salonId), {
      action: 'delete_customer',
      id: customerId,
    });
  },

  // GET: 다음 고객번호 조회
  getNextCustomerNumber: async (
    salonId: string
  ): Promise<ApiResponse<{ nextNumber: string }>> => {
    return apiClient.get(
      `${endpoints.salons.customers.path(salonId)}?action=next_number`
    );
  },
} as const;

// ============================================
// Legacy exports (backward compatibility)
// ============================================

/** @deprecated Use customerApi.getList instead */
export const createCustomersApi = () => ({
  getCustomers: (salonId: string) => customerApi.getList({ salon_id: salonId }),
  getCustomer: (salonId: string, id: string) => customerApi.getById(salonId, id),
  createCustomer: (salonId: string, customer: any) => customerApi.create(salonId, customer),
  updateCustomer: (salonId: string, id: string, updates: any) =>
    customerApi.update(salonId, id, updates),
  deleteCustomer: (salonId: string, id: string) => customerApi.delete(salonId, id),
});
