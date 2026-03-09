import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types';
import type { Booking } from '@/features/bookings/types';

export const getSalesBookings = (
  salonId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<Booking[]>> => {
  const base = endpoints.salons.bookings.path(salonId);
  return apiClient.get(
    `${base}?start_date=${startDate}&end_date=${endDate}&sales_only=true`
  );
};
