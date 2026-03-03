/**
 * /api/salons/[salonId]/bookings/[bookingId]
 *
 * PATCH  — 예약 업데이트 (일정변경 / 상태전환: confirm, cancel, complete)
 * DELETE — 예약 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookingService } from "@/lib/api-core";
import { AppError, handleApiError, requireField } from "@/lib/errors";

type RouteContext = { params: Promise<{ salonId: string; bookingId: string }> };

// ─────────────────────────────────────────
// GET /api/salons/[salonId]/bookings/[bookingId]
// ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId, bookingId } = await params;
    requireField(bookingId, "bookingId");

    const supabase = createClient(req);
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_date, artist_id")
      .eq("id", bookingId)
      .eq("salon_id", salonId)
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "Booking not found");

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}

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

    let result;

    switch (action) {
      // ─── 예약 확정 ───
      case "confirm": {
        const { data: bookingSnap } = await supabase
          .from("bookings")
          .select("booking_meta")
          .eq("id", bookingId)
          .single();
        const snapMeta = (bookingSnap?.booking_meta as Record<string, unknown> | null) ?? {};
        const isReschedule = snapMeta.reschedule_pending === true;

        result = await bookingService.confirmBooking(bookingId);

        if (isReschedule) {
          const { reschedule_pending: _omit, ...restMeta } = snapMeta;
          await supabase
            .from("bookings")
            .update({ booking_meta: restMeta } as never)
            .eq("id", bookingId);
        }
        break;
      }

      // ─── 예약 취소 ───
      case "cancel": {
        result = await bookingService.cancelBooking(bookingId);
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
