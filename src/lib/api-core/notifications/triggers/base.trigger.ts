import { SupabaseClient } from "@supabase/supabase-js";
import type {
  BookingNotificationPayload,
  DbNotificationType,
  NotificationLocale,
  NotificationTriggerType,
  TemplateParams,
  TriggerResult,
} from "../types";
import { BOOKING_TEMPLATES } from "../templates/booking.templates";
import { TRIGGER_TO_DB_TYPE } from "../types";

// ============================================
// 예약 상세 조회 (모든 트리거 공통)
// ============================================
export async function fetchBookingPayload(
  client: SupabaseClient,
  bookingId: string,
): Promise<BookingNotificationPayload | null> {
  const { data, error } = await client
    .from("bookings")
    .select(`
      id, salon_id, customer_id, booking_date, start_time, booking_meta,
      customer:customers!bookings_customer_id_fkey(id, name),
      artist:users!bookings_artist_id_fkey(id, name),
      service:services(id, name, category:service_categories(name, name_en, name_th)),
      salon:salons!bookings_salon_id_fkey(id, name, settings)
    `)
    .eq("id", bookingId)
    .single();

  if (error || !data) return null;

  const category = (data.service as any)?.category;
  return {
    bookingId: data.id,
    salonId: data.salon_id,
    customerId: data.customer_id,
    customerName: (data.customer as any)?.name ?? "Customer",
    artistName: (data.artist as any)?.name ?? "",
    salonName: (data.salon as any)?.name ?? "",
    salonSettings: (data.salon as any)?.settings ?? {},
    categoryName: {
      ko: category?.name ?? (data.service as any)?.name ?? "",
      en: category?.name_en ?? category?.name ?? (data.service as any)?.name ?? "",
      th: category?.name_th ?? category?.name_en ?? (data.service as any)?.name ?? "",
    },
    bookingDate: data.booking_date,
    startTime: data.start_time?.slice(0, 5) ?? "",
    bookingMeta: (data.booking_meta as Record<string, unknown>) ?? {},
  };
}

// ============================================
// Locale 결정 로직
// ============================================
export function resolveLocale(payload: BookingNotificationPayload): NotificationLocale {
  const metaLocale = payload.bookingMeta?.locale as string | undefined;
  if (metaLocale === "ko" || metaLocale === "en" || metaLocale === "th") return metaLocale;

  const salonLocale = payload.salonSettings?.locale as string | undefined;
  if (salonLocale === "ko" || salonLocale === "th") return salonLocale;

  return "en";
}

// ============================================
// 날짜 포맷 (locale별)
// ============================================
function formatDate(dateStr: string, locale: NotificationLocale): string {
  const localeMap: Record<NotificationLocale, string> = { ko: "ko-KR", en: "en-US", th: "th-TH" };
  return new Date(dateStr).toLocaleDateString(localeMap[locale], {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// ============================================
// 중복 발송 방지 체크 (10분 이내)
// ============================================
async function isDuplicateNotification(
  client: SupabaseClient,
  bookingId: string,
  dbType: DbNotificationType,
  channel: "LINE" | "IN_APP",
): Promise<boolean> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await client
    .from("notifications")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("notification_type", dbType)
    .eq("channel", channel)
    .gt("created_at", tenMinutesAgo)
    .limit(1);

  return Boolean(data && data.length > 0);
}

// ============================================
// 알림 INSERT + LINE Edge Function 호출
// ============================================
export async function dispatchNotification(
  client: SupabaseClient,
  payload: BookingNotificationPayload,
  triggerType: NotificationTriggerType,
): Promise<TriggerResult> {
  const dbType = TRIGGER_TO_DB_TYPE[triggerType];
  const locale = resolveLocale(payload);
  const template = BOOKING_TEMPLATES[triggerType][locale];

  const formattedDate = formatDate(payload.bookingDate, locale);
  const templateParams: TemplateParams = {
    customerName: payload.customerName,
    date: formattedDate,
    time: payload.startTime,
    artistName: payload.artistName,
    categoryName: payload.categoryName[locale],
  };

  const title = template.title(payload.salonName);
  const body = template.body(templateParams);
  const metadata = {
    artist_name: payload.artistName,
    customer_name: payload.customerName,
    category_name: payload.categoryName[locale],
    booking_date: payload.bookingDate,
    start_time: payload.startTime,
    salon_name: payload.salonName,
    locale,
    trigger_type: triggerType,
  };

  const notificationIds: string[] = [];

  // LINE 알림
  const lineIsDuplicate = await isDuplicateNotification(client, payload.bookingId, dbType, "LINE");
  if (!lineIsDuplicate) {
    const { data: lineNotif, error: lineErr } = await client
      .from("notifications")
      .insert({
        booking_id: payload.bookingId,
        salon_id: payload.salonId,
        channel: "LINE",
        notification_type: dbType,
        recipient_type: "CUSTOMER",
        recipient_customer_id: payload.customerId,
        title,
        body,
        metadata,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (!lineErr && lineNotif?.id) {
      notificationIds.push(lineNotif.id);
    }
  }

  // IN_APP 알림 (관리자 대상)
  const inAppIsDuplicate = await isDuplicateNotification(client, payload.bookingId, dbType, "IN_APP");
  if (!inAppIsDuplicate) {
    await client.from("notifications").insert({
      booking_id: payload.bookingId,
      salon_id: payload.salonId,
      channel: "IN_APP",
      notification_type: dbType,
      recipient_type: "ADMIN",
      title,
      body,
      metadata,
      status: "PENDING",
    });
  }

  // LINE Edge Function 즉시 호출 (fire-and-forget)
  if (notificationIds.length > 0) {
    client.functions
      .invoke("send-line-notifications", { body: { notification_ids: notificationIds } })
      .catch((err: Error) => console.error(`[Notification] Edge Function error (${triggerType}):`, err));
  }

  console.log(`[Notification] Dispatched ${triggerType} (${locale}) for booking: ${payload.bookingId}`);

  return { success: true, notificationIds };
}
