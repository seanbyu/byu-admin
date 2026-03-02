// ============================================
// Notification System - Core Types
// ============================================

export type NotificationLocale = "ko" | "en" | "th";

export type NotificationChannel = "LINE" | "IN_APP";

export type NotificationTriggerType =
  | "BOOKING_CONFIRMED"        // 예약 확정
  | "BOOKING_CHANGE_CONFIRMED" // 변경 후 재확정
  | "BOOKING_CHANGED"          // 예약 변경 (일정/담당자 변경)
  | "BOOKING_CANCELLED"        // 예약 취소
  | "AUTO_REBOOK";             // 자동 재예약 유도

// DB enum과 매핑
export type DbNotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_MODIFIED";

export const TRIGGER_TO_DB_TYPE: Record<NotificationTriggerType, DbNotificationType> = {
  BOOKING_CONFIRMED:        "BOOKING_CONFIRMED",
  BOOKING_CHANGE_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_CHANGED:          "BOOKING_MODIFIED",
  BOOKING_CANCELLED:        "BOOKING_CANCELLED",
  AUTO_REBOOK:              "BOOKING_CONFIRMED",
};

export interface BookingNotificationPayload {
  bookingId: string;
  salonId: string;
  customerId: string;
  customerName: string;
  artistName: string;
  salonName: string;
  salonSettings: Record<string, unknown>;
  categoryName: Record<NotificationLocale, string>;
  bookingDate: string;
  startTime: string;
  bookingMeta: Record<string, unknown>;
}

export interface TemplateParams {
  customerName: string;
  date: string;
  time: string;
  artistName: string;
  categoryName: string;
}

export interface NotificationTemplate {
  title: (salonName: string) => string;
  body: (params: TemplateParams) => string;
}

export type LocalizedTemplate = Record<NotificationLocale, NotificationTemplate>;

export interface TriggerResult {
  success: boolean;
  notificationIds: string[];
  skippedReason?: string;
  error?: string;
}
