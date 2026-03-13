import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types';
import type { Booking } from '@/features/bookings/types';

const bookingsPath = (salonId: string) => endpoints.salons.bookings.path(salonId);
const customersPath = (salonId: string) => endpoints.salons.customers.path(salonId);

export const getDashboardTodayBookings = (
  salonId: string,
  date: string
): Promise<ApiResponse<Booking[]>> =>
  apiClient.get(`${bookingsPath(salonId)}?start_date=${date}&end_date=${date}`);

export const getDashboardMonthlyBookings = (
  salonId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<Booking[]>> =>
  apiClient.get(
    `${bookingsPath(salonId)}?start_date=${startDate}&end_date=${endDate}&sales_only=true`
  );

/** 고객 전체 수만 조회 (limit=1로 total만 취득, 고객 피처 모듈 import 불필요) */
export const getDashboardCustomerCount = (
  salonId: string
): Promise<ApiResponse<{ customers: unknown[]; total: number }>> =>
  apiClient.get(`${customersPath(salonId)}?limit=1`);
