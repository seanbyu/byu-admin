'use client';

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import {
  Staff,
  StaffPosition,
  CreatePositionDto,
  UpdatePositionDto,
} from './types';
import { ApiResponse } from '@/types';

// ============================================
// Staff API Functions
// - 순수 함수로 API 호출만 담당
// - TanStack Query의 queryFn으로 직접 사용 가능
// ============================================

export const staffApi = {
  // GET: 직원 목록 조회
  getList: (salonId: string): Promise<ApiResponse<Staff[]>> => {
    return apiClient.get(endpoints.salons.staff.path(salonId));
  },

  // GET: 단일 직원 조회
  getById: (salonId: string, staffId: string): Promise<ApiResponse<Staff>> => {
    return apiClient.get(`${endpoints.salons.staff.path(salonId)}/${staffId}`);
  },

  // POST: 직원 정보 업데이트
  update: (
    salonId: string,
    staffId: string,
    updates: Partial<Staff>
  ): Promise<ApiResponse<Staff>> => {
    return apiClient.post(endpoints.salons.staff.path(salonId), {
      action: 'update_staff',
      staffId,
      updates,
    });
  },

  // PUT: 직원 표시 순서 업데이트
  updateDisplayOrder: (
    salonId: string,
    staffOrders: { staffId: string; displayOrder: number }[]
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return apiClient.put(`${endpoints.salons.staff.path(salonId)}/display-order`, {
      staffOrders,
    });
  },
} as const;

// ============================================
// Position API Functions
// ============================================

export const positionApi = {
  // GET: 직급 목록 조회
  getList: (salonId: string): Promise<ApiResponse<StaffPosition[]>> => {
    return apiClient.get(endpoints.salons.positions.path(salonId));
  },

  // POST: 직급 생성
  create: (
    salonId: string,
    dto: CreatePositionDto
  ): Promise<ApiResponse<StaffPosition>> => {
    return apiClient.post(endpoints.salons.positions.path(salonId), dto);
  },

  // PATCH: 직급 수정
  update: (
    positionId: string,
    dto: UpdatePositionDto
  ): Promise<ApiResponse<StaffPosition>> => {
    return apiClient.patch(endpoints.positions.detail.path(positionId), dto);
  },

  // DELETE: 직급 삭제
  delete: (positionId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(endpoints.positions.detail.path(positionId));
  },
} as const;

// ============================================
// Legacy exports (backward compatibility)
// TODO: 다른 곳에서 사용 중이면 마이그레이션 후 제거
// ============================================

/** @deprecated Use staffApi instead */
export const createStaffApi = () => ({
  getStaffList: staffApi.getList,
  updateStaff: staffApi.update,
});

/** @deprecated Use positionApi instead */
export const staffPositionApi = {
  getPositions: positionApi.getList,
  createPosition: positionApi.create,
  updatePosition: positionApi.update,
  deletePosition: positionApi.delete,
};
