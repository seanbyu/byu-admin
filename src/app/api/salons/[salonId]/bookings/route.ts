import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { BookingService } from '@/lib/api-core';

/**
 * Service Role Client (RLS 우회) - 알림 생성 등 시스템 작업용
 */
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * 예약 상세 조회 (알림 생성에 필요한 관계 데이터 포함)
 */
async function getBookingWithDetails(adminClient: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await adminClient
    .from("bookings")
    .select(`
      *,
      customer:customers!bookings_customer_id_fkey(id, name, phone),
      artist:users!bookings_artist_id_fkey(id, name),
      service:services(id, name, category:service_categories(name, name_en, name_th)),
      salon:salons!bookings_salon_id_fkey(id, name, settings)
    `)
    .eq("id", bookingId)
    .single();

  if (error) {
    console.error("[Booking Notification] Failed to get booking details:", error);
    return null;
  }
  return data;
}

type BookingDetails = NonNullable<Awaited<ReturnType<typeof getBookingWithDetails>>>;
type Locale = "ko" | "en" | "th";

// ============================================
// 다국어 알림 템플릿 (ko / en / th)
// ============================================
const NOTIFICATION_TEMPLATES = {
  BOOKING_CONFIRMED: {
    ko: {
      title: (salonName: string) => `${salonName} 예약 알림`,
      body: (p: { customerName: string; date: string; time: string; artistName: string; categoryName: string }) =>
        `${p.customerName}님, ${p.date} ${p.time} ${p.artistName}님과의 ${p.categoryName} 예약이 확정되었습니다.`,
    },
    en: {
      title: (salonName: string) => `${salonName} Booking Confirmation`,
      body: (p: { customerName: string; date: string; time: string; artistName: string; categoryName: string }) =>
        `${p.customerName}, your ${p.categoryName} appointment with ${p.artistName} on ${p.date} at ${p.time} has been confirmed.`,
    },
    th: {
      title: (salonName: string) => `${salonName} แจ้งเตือนการจอง`,
      body: (p: { customerName: string; date: string; time: string; artistName: string; categoryName: string }) =>
        `${p.customerName} การจอง ${p.categoryName} กับ ${p.artistName} วันที่ ${p.date} เวลา ${p.time} ได้รับการยืนยันแล้วค่ะ`,
    },
  },
  BOOKING_CANCELLED: {
    ko: {
      title: (salonName: string) => `${salonName} 예약 알림`,
      body: (p: { customerName: string; date: string; time: string; artistName: string; categoryName: string }) =>
        `${p.customerName}님, ${p.date} ${p.time} ${p.artistName}님과의 ${p.categoryName} 예약이 취소되었습니다.`,
    },
    en: {
      title: (salonName: string) => `${salonName} Booking Cancellation`,
      body: (p: { customerName: string; date: string; time: string; artistName: string; categoryName: string }) =>
        `${p.customerName}, your ${p.categoryName} appointment with ${p.artistName} on ${p.date} at ${p.time} has been cancelled.`,
    },
    th: {
      title: (salonName: string) => `${salonName} แจ้งเตือนการจอง`,
      body: (p: { customerName: string; date: string; time: string; artistName: string; categoryName: string }) =>
        `${p.customerName} การจอง ${p.categoryName} กับ ${p.artistName} วันที่ ${p.date} เวลา ${p.time} ถูกยกเลิกแล้วค่ะ`,
    },
  },
} as const;

/**
 * 살롱 locale 조회 (salons.settings JSONB에서)
 */
function getSalonLocale(booking: BookingDetails): Locale {
  const settings = (booking.salon as any)?.settings;
  const locale = settings?.locale;
  if (locale === "ko" || locale === "th") return locale;
  return "en";
}

/**
 * 카테고리명 추출 (locale별 다국어)
 */
function getCategoryName(booking: BookingDetails, locale: Locale): string {
  const category = (booking.service as any)?.category;
  if (!category) return (booking.service as any)?.name || "";

  if (locale === "ko") return category.name || category.name_en || "";
  if (locale === "th") return category.name_th || category.name_en || category.name || "";
  return category.name_en || category.name || "";
}

/**
 * 날짜 포맷 (locale별)
 */
function formatDate(dateStr: string, locale: Locale): string {
  const localeMap: Record<Locale, string> = { ko: "ko-KR", en: "en-US", th: "th-TH" };
  return new Date(dateStr).toLocaleDateString(localeMap[locale], {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 예약 알림 공통: notifications INSERT + LINE Edge Function 호출
 */
async function sendBookingNotification(
  adminClient: ReturnType<typeof createAdminClient>,
  booking: BookingDetails,
  notificationType: "BOOKING_CONFIRMED" | "BOOKING_CANCELLED",
) {
  const locale = getSalonLocale(booking);
  const template = NOTIFICATION_TEMPLATES[notificationType][locale];

  const customerName = (booking.customer as any)?.name || "Customer";
  const artistName = (booking.artist as any)?.name || "";
  const salonName = (booking.salon as any)?.name || "";
  const categoryName = getCategoryName(booking, locale);
  const startTime = booking.start_time?.slice(0, 5) || "";
  const formattedDate = formatDate(booking.booking_date, locale);

  const title = template.title(salonName);
  const body = template.body({
    customerName,
    date: formattedDate,
    time: startTime,
    artistName,
    categoryName,
  });

  const metadata = {
    artist_name: artistName,
    customer_name: customerName,
    category_name: categoryName,
    booking_date: booking.booking_date,
    start_time: startTime,
    salon_name: salonName,
    locale,
  };

  // 중복 체크
  const { data: existing } = await adminClient
    .from("notifications")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("notification_type", notificationType)
    .eq("channel", "LINE")
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`[Booking Notification] ${notificationType} LINE already exists for booking:`, booking.id);
    return;
  }

  // LINE 알림 생성
  const { data: lineNotif, error: lineErr } = await adminClient
    .from("notifications")
    .insert({
      booking_id: booking.id,
      salon_id: booking.salon_id,
      channel: "LINE",
      notification_type: notificationType,
      recipient_type: "CUSTOMER",
      recipient_customer_id: booking.customer_id,
      title,
      body,
      metadata,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (lineErr) {
    console.error("[Booking Notification] Failed to create LINE notification:", lineErr);
  }

  // IN_APP 알림 생성
  const { error: inAppErr } = await adminClient
    .from("notifications")
    .insert({
      booking_id: booking.id,
      salon_id: booking.salon_id,
      channel: "IN_APP",
      notification_type: notificationType,
      recipient_type: "CUSTOMER",
      recipient_customer_id: booking.customer_id,
      title,
      body,
      metadata,
      status: "PENDING",
    });

  if (inAppErr) {
    console.error("[Booking Notification] Failed to create IN_APP notification:", inAppErr);
  }

  // Edge Function 즉시 호출 (LINE 발송)
  if (lineNotif?.id) {
    const { error: fnError } = await adminClient.functions.invoke(
      "send-line-notifications",
      { body: { notification_ids: [lineNotif.id] } }
    );

    if (fnError) {
      console.error("[Booking Notification] Edge Function invocation failed:", fnError);
    }
  }

  console.log(`[Booking Notification] Created ${notificationType} (${locale}) notifications for booking:`, booking.id);
}

/**
 * 예약 확정 알림
 */
async function sendBookingConfirmedNotifications(
  adminClient: ReturnType<typeof createAdminClient>,
  booking: BookingDetails,
) {
  try {
    await sendBookingNotification(adminClient, booking, "BOOKING_CONFIRMED");
  } catch (error) {
    console.error("[Booking Notification] Confirmed error:", error);
  }
}

/**
 * 예약 취소 알림
 */
async function sendBookingCancelledNotifications(
  adminClient: ReturnType<typeof createAdminClient>,
  booking: BookingDetails,
) {
  try {
    await sendBookingNotification(adminClient, booking, "BOOKING_CANCELLED");
  } catch (error) {
    console.error("[Booking Notification] Cancelled error:", error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const { searchParams } = new URL(req.url); // Use filters if needed

    const supabase = createClient(req);
    const service = new BookingService(supabase);
    const bookings = await service.getBookings(salonId);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    const supabase = createClient(req);
    const service = new BookingService(supabase);
    let result;

    if (action) {
      switch (action) {
        case 'cancel_booking': {
          result = await service.cancelBooking(data.id);

          // 취소 알림 생성 + LINE 발송 (fire-and-forget)
          const cancelAdminClient = createAdminClient();
          getBookingWithDetails(cancelAdminClient, data.id).then((booking) => {
            if (booking) {
              sendBookingCancelledNotifications(cancelAdminClient, booking);
            }
          });
          break;
        }
        case 'complete_booking':
          result = await service.completeBooking(data.id);
          break;
        case 'confirm_booking': {
          result = await service.confirmBooking(data.id);

          // 알림 생성 + LINE 발송 (fire-and-forget)
          const adminClient = createAdminClient();
          getBookingWithDetails(adminClient, data.id).then((booking) => {
            if (booking) {
              sendBookingConfirmedNotifications(adminClient, booking);
            }
          });
          break;
        }
        case 'update_booking': {
          result = await service.updateBooking(data.id, data.updates);

          // 상태 변경에 따른 알림 발송
          if (data.updates?.status === 'CONFIRMED' || data.updates?.status === 'CANCELLED') {
            const adminClient = createAdminClient();
            getBookingWithDetails(adminClient, data.id).then((booking) => {
              if (booking) {
                if (data.updates.status === 'CONFIRMED') {
                  sendBookingConfirmedNotifications(adminClient, booking);
                } else {
                  sendBookingCancelledNotifications(adminClient, booking);
                }
              }
            });
          }
          break;
        }
        case 'create_booking':
          result = await service.createBooking(salonId, data);
          break;
        case 'delete_booking':
          await service.deleteBooking(data.id);
          result = null;
          break;
        default:
          return NextResponse.json(
            { success: false, message: 'Invalid action' },
            { status: 400 }
          );
      }
    } else {
      // Legacy support: default to create if no action for backward compatibility
      result = await service.createBooking(salonId, body);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
