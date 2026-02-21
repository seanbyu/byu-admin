/**
 * Notifications API
 */

import { supabase } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  title: string | null;
  body: string;
  notification_type: string;
  status: string;
  created_at: string;
  read_at: string | null;
  booking_id: string | null;
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
    .eq("channel", "IN_APP") // 인앱 알림만 조회
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
    .eq("channel", "IN_APP") // 인앱 알림만 카운트
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
