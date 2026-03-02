/**
 * /api/salons/[salonId]/bookings/[bookingId]
 *
 * PATCH  — 예약 업데이트 (일정변경 / 상태전환: confirm, cancel, complete)
 * DELETE — 예약 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { BookingService } from "@/lib/api-core";
import { NotificationService } from "@/lib/api-core/notifications/notification.service";
import { AppError, handleApiError, requireField } from "@/lib/errors";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type RouteContext = { params: Promise<{ salonId: string; bookingId: string }> };

// ─────────────────────────────────────────
// PATCH /api/salons/[salonId]/bookings/[bookingId]
//
// Body 옵션:
//   { action: 'confirm' }          — 예약 확정
//   { action: 'cancel' }           — 예약 취소
//   { action: 'complete' }         — 시술 완료
//   { updates: { ... } }           — 일반 필드 업데이트
// ─────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { bookingId } = await params;
    requireField(bookingId, "bookingId");

    const body = await req.json();
    const { action, updates } = body as {
      action?: "confirm" | "cancel" | "complete";
      updates?: Record<string, unknown>;
    };

    const supabase = createClient(req);
    const bookingService = new BookingService(supabase);
    const adminClient = createAdminClient();
    const notifService = new NotificationService(adminClient);

    let result;

    switch (action) {
      // ─── 예약 확정 ───
      case "confirm": {
        result = await bookingService.confirmBooking(bookingId);
        notifService.onBookingConfirmed(bookingId).catch(console.error);
        break;
      }

      // ─── 예약 취소 ───
      case "cancel": {
        result = await bookingService.cancelBooking(bookingId);
        notifService.onBookingCancelled(bookingId).catch(console.error);
        break;
      }

      // ─── 시술 완료 ───
      case "complete": {
        result = await bookingService.completeBooking(bookingId);
        break;
      }

      // ─── 일반 업데이트 (일정/담당자 변경 등) ───
      default: {
        if (!updates || Object.keys(updates).length === 0) {
          throw new AppError("MISSING_REQUIRED_FIELD", "Either 'action' or 'updates' is required");
        }

        result = await bookingService.updateBooking(bookingId, updates);

        const bookingMeta = (updates.bookingMeta as Record<string, unknown>) ?? {};
        notifService
          .onBookingUpdated(bookingId, updates, bookingMeta)
          .then(async () => {
            // 재확정 시 reschedule_pending 플래그 클리어
            if (updates.status === "CONFIRMED" && bookingMeta?.reschedule_pending) {
              const { reschedule_pending, ...restMeta } = bookingMeta;
              await adminClient
                .from("bookings")
                .update({ booking_meta: restMeta })
                .eq("id", bookingId);
            }
          })
          .catch(console.error);
        break;
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────
// DELETE /api/salons/[salonId]/bookings/[bookingId]
// ─────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { bookingId } = await params;
    requireField(bookingId, "bookingId");

    const supabase = createClient(req);
    const bookingService = new BookingService(supabase);
    await bookingService.deleteBooking(bookingId);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
