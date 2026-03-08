/**
 * Bookings API Client
 *
 * REST 엔드포인트:
 *   GET    /api/salons/{salonId}/bookings                  — 목록 조회
 *   POST   /api/salons/{salonId}/bookings                  — 생성
 *   PATCH  /api/salons/{salonId}/bookings/{bookingId}      — 업데이트 / 상태전환
 *   DELETE /api/salons/{salonId}/bookings/{bookingId}      — 삭제
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiResponse, Booking } from "@/types";
import type { BookingNotificationStatus } from "@/app/api/salons/[salonId]/bookings/notification-status/route";

// 단건 예약 경로
const bookingPath = (salonId: string, bookingId: string) =>
  `${endpoints.salons.bookings.path(salonId)}/${bookingId}`;

export const createBookingsApi = () => ({
  // ─── 목록 조회 ───
  getBookings: (salonId: string): Promise<ApiResponse<Booking[]>> =>
    apiClient.get(endpoints.salons.bookings.path(salonId)),

  // ─── 예약 생성 ───
  createBooking: (
    salonId: string,
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Booking>> =>
    apiClient.post(endpoints.salons.bookings.path(salonId), booking),

  // ─── 예약 확정 ───
  confirmBooking: (salonId: string, bookingId: string): Promise<ApiResponse<Booking>> =>
    apiClient.patch(bookingPath(salonId, bookingId), { action: "confirm" }),

  // ─── 예약 취소 ───
  cancelBooking: (salonId: string, bookingId: string): Promise<ApiResponse<Booking>> =>
    apiClient.patch(bookingPath(salonId, bookingId), { action: "cancel" }),

  // ─── 시술 완료 ───
  completeBooking: (salonId: string, bookingId: string): Promise<ApiResponse<Booking>> =>
    apiClient.patch(bookingPath(salonId, bookingId), { action: "complete" }),

  // ─── 일반 업데이트 (일정/담당자/메모 등) ───
  updateBooking: (
    salonId: string,
    bookingId: string,
    updates: Partial<Booking>
  ): Promise<ApiResponse<Booking>> =>
    apiClient.patch(bookingPath(salonId, bookingId), { updates }),

  // ─── 예약 삭제 ───
  deleteBooking: (salonId: string, bookingId: string): Promise<ApiResponse<null>> =>
    apiClient.delete(bookingPath(salonId, bookingId)),

  // ─── LINE 발송 상태 조회 ───
  getNotificationStatuses: (
    salonId: string,
    date: string // YYYY-MM-DD
  ): Promise<ApiResponse<Record<string, BookingNotificationStatus>>> =>
    apiClient.get(
      `${endpoints.salons.bookings.path(salonId)}/notification-status?date=${date}`
    ),
});
