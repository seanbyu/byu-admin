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
    refetchInterval: 30000, // 30초마다 자동 새로고침
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
    refetchInterval: 30000, // 30초마다 자동 새로고침
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
    mutationFn: markAsRead,
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
 * 알림 타입별 메시지 생성
 */
export function getNotificationMessage(
  notification: Notification,
  t: (key: string) => string
): string {
  const type = notification.notification_type;

  // 제목이 있으면 제목 사용
  if (notification.title) {
    return notification.title;
  }

  // 타입별 기본 메시지
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
      return notification.body;
  }
}
