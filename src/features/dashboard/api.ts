import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types';
import type { Booking } from '@/features/bookings/types';

const bookingsPath = (salonId: string) => endpoints.salons.bookings.path(salonId);

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
