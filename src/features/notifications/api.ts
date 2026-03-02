/**
 * Notifications API Client
 *
 * Supabase 직접 접근 제거 → API Route 경유
 * REST 엔드포인트: /api/salons/{salonId}/notifications
 */

import { apiClient } from "@/lib/api/client";

const notifPath = (salonId: string) => `/salons/${salonId}/notifications`;

export interface NotificationMetadata {
  artist_name?: string;
  customer_name?: string;
  category_name?: string;
  booking_date?: string;
  start_time?: string;
  salon_name?: string;
  locale?: string;
  trigger_type?: string;
}

export interface Notification {
  id: string;
  title: string | null;
  body: string;
  notification_type: string;
  status: string;
  created_at: string;
  read_at: string | null;
  booking_id: string | null;
  metadata: NotificationMetadata | null;
}

// ─── 알림 목록 조회 ───
export async function getNotifications(salonId: string, limit = 10): Promise<Notification[]> {
  try {
    const res = await apiClient.get<Notification[]>(notifPath(salonId), { limit });
    return res.data ?? [];
  } catch (error) {
    if ((error as any)?.message?.includes("AbortError")) return [];
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
}

// ─── 미읽음 카운트 조회 ───
export async function getUnreadCount(salonId: string): Promise<number> {
  try {
    const res = await apiClient.get<{ unreadCount: number }>(notifPath(salonId), {
      unread_count: true,
    });
    return res.data?.unreadCount ?? 0;
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return 0;
  }
}

// ─── 단건 읽음 처리 ───
export async function markAsRead(salonId: string, notificationId: string): Promise<void> {
  await apiClient.patch(notifPath(salonId), { id: notificationId });
}

// ─── 전체 읽음 처리 ───
export async function markAllAsRead(salonId: string): Promise<void> {
  await apiClient.patch(notifPath(salonId), {});
}

// ─── 알림 삭제 ───
export async function deleteNotification(salonId: string, notificationId: string): Promise<void> {
  await apiClient.delete(`${notifPath(salonId)}?id=${notificationId}`);
}

// ─── 예약 정보 조회 (알림 클릭 시 날짜/직원 이동용) ───
export interface BookingInfo {
  booking_date: string;
  artist_id: string;
}

export async function getBookingInfo(salonId: string, bookingId: string): Promise<BookingInfo | null> {
  try {
    const res = await apiClient.get<BookingInfo>(`/salons/${salonId}/bookings/${bookingId}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}
