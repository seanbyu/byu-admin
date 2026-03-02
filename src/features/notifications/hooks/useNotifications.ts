/**
 * Notifications Hooks
 */

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
} from "../api";

/**
 * 알림 목록 조회 훅
 */
export function useNotifications(limit = 10) {
  const { user } = useAuthStore();
  const salonId = user?.salonId;

  return useQuery({
    queryKey: ["notifications", salonId, limit],
    queryFn: () => getNotifications(salonId!, limit),
    enabled: !!salonId,
    refetchInterval: 5 * 60 * 1000, // Realtime이 주 업데이트, 5분은 연결 끊김 대비 fallback
  });
}

/**
 * 읽지 않은 알림 수 조회 훅
 */
export function useUnreadCount() {
  const { user } = useAuthStore();
  const salonId = user?.salonId;

  return useQuery({
    queryKey: ["notifications", "unread-count", salonId],
    queryFn: () => getUnreadCount(salonId!),
    enabled: !!salonId,
    refetchInterval: 5 * 60 * 1000, // Realtime이 주 업데이트, 5분은 연결 끊김 대비 fallback
  });
}

/**
 * 알림 읽음 표시 훅
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const salonId = user?.salonId;

  return useMutation({
    mutationFn: (id: string) => markAsRead(salonId!, id),
    onSuccess: () => {
      // 알림 목록과 읽지 않은 수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications", salonId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", salonId] });
    },
  });
}

/**
 * 모든 알림 읽음 표시 훅
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const salonId = user?.salonId;

  return useMutation({
    mutationFn: () => markAllAsRead(salonId!),
    onSuccess: () => {
      // 알림 목록과 읽지 않은 수 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications", salonId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", salonId] });
    },
  });
}

/**
 * 알림 삭제 훅
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const salonId = user?.salonId;

  return useMutation({
    mutationFn: (id: string) => deleteNotification(salonId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", salonId] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", salonId] });
    },
  });
}

/**
 * 상대 시간 표시 유틸
 */
export function getRelativeTime(date: string, t: (key: string) => string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return t("common.time.justNow");
  } else if (diffMins < 60) {
    return `${diffMins} ${t("common.time.minutes")} ${t("common.time.ago")}`;
  } else if (diffHours < 24) {
    return `${diffHours} ${t("common.time.hours")} ${t("common.time.ago")}`;
  } else {
    return `${diffDays} ${t("common.time.days")} ${t("common.time.ago")}`;
  }
}

/**
 * 알림 타입별 제목 생성
 */
export function getNotificationTitle(
  notification: Notification,
  t: (key: string) => string
): string {
  const type = notification.notification_type;

  switch (type) {
    case "BOOKING_REQUEST":
      return t("common.notifications.newBooking");
    case "BOOKING_CONFIRMED":
      return t("common.notifications.confirmedBooking");
    case "BOOKING_CANCELLED":
      return t("common.notifications.cancelledBooking");
    case "BOOKING_REMINDER":
      return t("common.notifications.bookingReminder");
    case "BOOKING_COMPLETED":
      return t("common.notifications.completedBooking");
    case "BOOKING_NO_SHOW":
      return t("common.notifications.noShowBooking");
    case "REVIEW_RECEIVED":
      return t("common.notifications.newReview");
    default:
      return notification.title || notification.body;
  }
}

/**
 * 알림 메타데이터에서 상세 정보 생성
 * 예: "2월 24일 (화) 18:00" / "tiw | cut"
 */
export function getNotificationDetail(
  notification: Notification,
  t: (key: string) => string,
  locale: string
): { dateTime: string | null; staffService: string | null } {
  const meta = notification.metadata;
  if (!meta) return { dateTime: null, staffService: null };

  // 날짜 + 시간
  let dateTime: string | null = null;
  if (meta.booking_date && meta.start_time) {
    const date = new Date(meta.booking_date + 'T00:00:00');
    const formatted = date.toLocaleDateString(locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : 'ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    dateTime = `${formatted} ${meta.start_time}`;
  }

  // 직원 | 서비스
  let staffService: string | null = null;
  const parts: string[] = [];
  if (meta.artist_name) parts.push(meta.artist_name);
  if (meta.service_name) parts.push(meta.service_name);
  if (parts.length > 0) {
    staffService = parts.join(' | ') + ' ' + t('common.notifications.pendingStatus');
  }

  return { dateTime, staffService };
}

/**
 * @deprecated Use getNotificationTitle instead
 */
export const getNotificationMessage = getNotificationTitle;
