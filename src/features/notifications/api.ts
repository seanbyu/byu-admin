/**
 * Notifications API
 */

import { supabase } from "@/lib/supabase/client";

export interface NotificationMetadata {
  artist_name?: string;
  customer_name?: string;
  service_name?: string | null;
  booking_date?: string;
  start_time?: string;
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

/**
 * 살롱의 알림 목록 조회
 */
export async function getNotifications(salonId: string, limit = 10): Promise<Notification[]> {

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("salon_id", salonId)
    .eq("recipient_type", "ADMIN")
    .eq("channel", "IN_APP")
    .neq("status", "FAILED") // soft-deleted 제외
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // AbortError: auth 세션 갱신 시 Supabase가 요청을 중단하는 정상 동작
    if (error.message?.includes('AbortError')) return [];
    console.error("Failed to fetch notifications:", error);
    throw error;
  }

  return data || [];
}

/**
 * 읽지 않은 알림 수 조회
 */
export async function getUnreadCount(salonId: string): Promise<number> {

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .eq("recipient_type", "ADMIN")
    .eq("channel", "IN_APP")
    .neq("status", "FAILED") // soft-deleted 제외
    .is("read_at", null);

  if (error) {
    console.error("Failed to fetch unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * 알림을 읽음으로 표시
 */
export async function markAsRead(notificationId: string): Promise<void> {

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * 모든 알림을 읽음으로 표시
 */
export async function markAllAsRead(salonId: string): Promise<void> {

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("salon_id", salonId)
    .eq("recipient_type", "ADMIN")
    .eq("channel", "IN_APP") // 인앱 알림만 업데이트
    .is("read_at", null);

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * 알림 삭제 (실제 DELETE - RLS DELETE 정책 적용)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to delete notification:", error);
    throw error;
  }
}

/**
 * 예약 정보 조회 (알림 클릭 시 해당 날짜/직원으로 이동용)
 */
export interface BookingInfo {
  booking_date: string;
  artist_id: string;
}

export async function getBookingInfo(bookingId: string): Promise<BookingInfo | null> {
  const { data } = await supabase
    .from("bookings")
    .select("booking_date, artist_id")
    .eq("id", bookingId)
    .single();

  return (data as BookingInfo | null) || null;
}
