import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { BookingService } from '@/lib/api-core';
import { NotificationService } from '@/lib/api-core/notifications/notification.service';

/**
 * Service Role Client (RLS 우회) — 알림 생성 등 시스템 작업용
 */
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(req);
    const service = new BookingService(supabase);
    const bookings = await service.getBookings(salonId);

    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error('[Booking API] GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
    const bookingService = new BookingService(supabase);
    let result;

    if (action) {
      switch (action) {
        // ─────────────────────────────────────────
        // 예약 확정
        // ─────────────────────────────────────────
        case 'confirm_booking': {
          result = await bookingService.confirmBooking(data.id);

          const adminClient = createAdminClient();
          const notifService = new NotificationService(adminClient);
          notifService.onBookingConfirmed(data.id).catch(console.error);
          break;
        }

        // ─────────────────────────────────────────
        // 예약 취소
        // ─────────────────────────────────────────
        case 'cancel_booking': {
          result = await bookingService.cancelBooking(data.id);

          const adminClient = createAdminClient();
          const notifService = new NotificationService(adminClient);
          notifService.onBookingCancelled(data.id).catch(console.error);
          break;
        }

        // ─────────────────────────────────────────
        // 예약 업데이트 (상태변경 / 일정변경 통합 처리)
        // ─────────────────────────────────────────
        case 'update_booking': {
          result = await bookingService.updateBooking(data.id, data.updates);

          const adminClient = createAdminClient();
          const notifService = new NotificationService(adminClient);

          // reschedule_pending 플래그 확인 후 전달
          const currentMeta = data.updates?.bookingMeta ?? {};
          notifService
            .onBookingUpdated(data.id, data.updates, currentMeta)
            .then(async (results) => {
              // 재확정 시 reschedule_pending 플래그 클리어
              const wasReschedule = currentMeta?.reschedule_pending === true;
              const wasConfirmed = data.updates?.status === "CONFIRMED";
              if (wasReschedule && wasConfirmed) {
                const { reschedule_pending, ...restMeta } = currentMeta;
                await adminClient
                  .from('bookings')
                  .update({ booking_meta: restMeta })
                  .eq('id', data.id);
              }
            })
            .catch(console.error);
          break;
        }

        // ─────────────────────────────────────────
        // 예약 생성
        // ─────────────────────────────────────────
        case 'create_booking': {
          result = await bookingService.createBooking(salonId, data);
          break;
        }

        // ─────────────────────────────────────────
        // 예약 완료
        // ─────────────────────────────────────────
        case 'complete_booking': {
          result = await bookingService.completeBooking(data.id);
          break;
        }

        // ─────────────────────────────────────────
        // 예약 삭제
        // ─────────────────────────────────────────
        case 'delete_booking': {
          await bookingService.deleteBooking(data.id);
          result = null;
          break;
        }

        default:
          return NextResponse.json(
            { success: false, message: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    } else {
      // Backward compatibility: action 없으면 create로 처리
      result = await bookingService.createBooking(salonId, body);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Booking API] POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
