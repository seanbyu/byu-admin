'use client';

import { useQuery } from '@tanstack/react-query';
import { createBookingsApi } from '../api';
import { bookingKeys } from './queries';
import type { BookingNotificationStatus } from '@/app/api/salons/[salonId]/bookings/notification-status/route';

const bookingsApi = createBookingsApi();

// 날짜별 예약 LINE 발송 상태 조회
// confirmed: BOOKING_CONFIRMED/BOOKING_MODIFIED가 sent 됐는지
// reminded:  BOOKING_REMINDER가 sent 됐는지
export function useBookingNotificationStatuses(salonId: string, date: string) {
  return useQuery<Record<string, BookingNotificationStatus>>({
    queryKey: bookingKeys.notificationStatuses(salonId, date),
    queryFn: async () => {
      const res = await bookingsApi.getNotificationStatuses(salonId, date);
      return res.data ?? {};
    },
    enabled: !!salonId && !!date,
    staleTime: 1000 * 60 * 2, // 2분 — 리마인더 발송 여부 반영
    gcTime: 1000 * 60 * 10,
  });
}
