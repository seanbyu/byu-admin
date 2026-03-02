import type { LocalizedTemplate, NotificationTriggerType, TemplateParams } from "../types";

// ============================================
// 예약 확정 템플릿
// ============================================
const BOOKING_CONFIRMED: LocalizedTemplate = {
  ko: {
    title: (s) => `${s} 예약 알림`,
    body: (p) => `${p.customerName}님, ${p.date} ${p.time} ${p.artistName}님과의 ${p.categoryName} 예약이 확정되었습니다.`,
  },
  en: {
    title: (s) => `${s} Booking Confirmation`,
    body: (p) => `${p.customerName}, your ${p.categoryName} appointment with ${p.artistName} on ${p.date} at ${p.time} has been confirmed.`,
  },
  th: {
    title: (s) => `${s} แจ้งเตือนการจอง`,
    body: (p) => `${p.customerName} การจอง ${p.categoryName} กับ ${p.artistName} วันที่ ${p.date} เวลา ${p.time} ได้รับการยืนยันแล้วค่ะ`,
  },
};

// ============================================
// 예약 변경 후 재확정 템플릿
// ============================================
const BOOKING_CHANGE_CONFIRMED: LocalizedTemplate = {
  ko: {
    title: (s) => `${s} 예약 알림`,
    body: (p) => `${p.customerName}님, ${p.date} ${p.time} ${p.artistName}님과의 ${p.categoryName} 예약 변경이 확정되었습니다.`,
  },
  en: {
    title: (s) => `${s} Booking Change Confirmed`,
    body: (p) => `${p.customerName}, your rescheduled ${p.categoryName} appointment with ${p.artistName} on ${p.date} at ${p.time} has been confirmed.`,
  },
  th: {
    title: (s) => `${s} แจ้งเตือนการจอง`,
    body: (p) => `${p.customerName} การเปลี่ยนเวลา ${p.categoryName} กับ ${p.artistName} วันที่ ${p.date} เวลา ${p.time} ได้รับการยืนยันแล้วค่ะ`,
  },
};

// ============================================
// 예약 변경 템플릿 (관리자가 일정 변경)
// ============================================
const BOOKING_CHANGED: LocalizedTemplate = {
  ko: {
    title: (s) => `${s} 예약 변경 알림`,
    body: (p) => `${p.customerName}님, ${p.categoryName} 예약이 ${p.date} ${p.time} ${p.artistName}님으로 변경되었습니다.`,
  },
  en: {
    title: (s) => `${s} Booking Rescheduled`,
    body: (p) => `${p.customerName}, your ${p.categoryName} appointment has been rescheduled to ${p.date} at ${p.time} with ${p.artistName}.`,
  },
  th: {
    title: (s) => `${s} แจ้งเตือนเปลี่ยนเวลา`,
    body: (p) => `${p.customerName} การจอง ${p.categoryName} ถูกเปลี่ยนเป็นวันที่ ${p.date} เวลา ${p.time} กับ ${p.artistName} ค่ะ`,
  },
};

// ============================================
// 예약 취소 템플릿
// ============================================
const BOOKING_CANCELLED: LocalizedTemplate = {
  ko: {
    title: (s) => `${s} 예약 알림`,
    body: (p) => `${p.customerName}님, ${p.date} ${p.time} ${p.artistName}님과의 ${p.categoryName} 예약이 취소되었습니다.`,
  },
  en: {
    title: (s) => `${s} Booking Cancellation`,
    body: (p) => `${p.customerName}, your ${p.categoryName} appointment with ${p.artistName} on ${p.date} at ${p.time} has been cancelled.`,
  },
  th: {
    title: (s) => `${s} แจ้งเตือนการจอง`,
    body: (p) => `${p.customerName} การจอง ${p.categoryName} กับ ${p.artistName} วันที่ ${p.date} เวลา ${p.time} ถูกยกเลิกแล้วค่ะ`,
  },
};

// ============================================
// 자동 재예약 유도 템플릿
// ============================================
const AUTO_REBOOK: LocalizedTemplate = {
  ko: {
    title: (s) => `${s} 재예약 안내`,
    body: (p) => `${p.customerName}님, ${p.categoryName} 다음 방문 시기가 다가왔어요! 편한 시간에 예약해 주세요.`,
  },
  en: {
    title: (s) => `${s} Time to Rebook`,
    body: (p) => `${p.customerName}, it's time for your next ${p.categoryName} appointment! Book at your convenience.`,
  },
  th: {
    title: (s) => `${s} แจ้งเตือนนัดหมายครั้งต่อไป`,
    body: (p) => `${p.customerName} ถึงเวลา ${p.categoryName} ครั้งต่อไปแล้วค่ะ! จองได้เลยนะคะ`,
  },
};

// ============================================
// 템플릿 레지스트리
// ============================================
export const BOOKING_TEMPLATES: Record<NotificationTriggerType, LocalizedTemplate> = {
  BOOKING_CONFIRMED,
  BOOKING_CHANGE_CONFIRMED,
  BOOKING_CHANGED,
  BOOKING_CANCELLED,
  AUTO_REBOOK,
};
