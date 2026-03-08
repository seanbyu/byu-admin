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

// fire-and-forget: outbox 레코드를 즉시 처리 (await 하지 않아 응답 속도에 영향 없음)
function triggerProcessOutbox() {
  fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-outbox`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: "{}",
    },
  ).catch(() => {/* pg_cron이 1분 내 재시도 */});
}

// ─────────────────────────────────────────
// GET /api/salons/[salonId]/bookings/[bookingId]
// ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId, bookingId } = await params;
    requireField(bookingId, "bookingId");

    const supabase = createClient(req);
    const bookingService = new BookingService(supabase);
    const data = await bookingService.getBookingSnapshot(bookingId, salonId);

    if (!data) throw new AppError("NOT_FOUND", "Booking not found");

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
  const t0 = performance.now();
  let action: string | undefined;

  try {
    const { bookingId } = await params;
    requireField(bookingId, "bookingId");

    const body = await req.json();
    const { action: _action, updates } = body as {
      action?: "confirm" | "cancel" | "complete";
      updates?: Record<string, unknown>;
    };
    action = _action;

    const supabase = createClient(req);
    const bookingService = new BookingService(supabase);

    let result;

    switch (action) {
      // ─── 예약 확정 ───
      case "confirm": {
        const snapMeta = await bookingService.getBookingMeta(bookingId);
        const isReschedule = snapMeta.reschedule_pending === true;

        result = await bookingService.confirmBooking(bookingId);

        if (isReschedule) {
          const { reschedule_pending: _omit, ...restMeta } = snapMeta;
          await bookingService.updateBookingMeta(bookingId, restMeta);
        }
        triggerProcessOutbox();
        break;
      }

      // ─── 예약 취소 ───
      case "cancel": {
        // 트리거 발동 전 cancelled_by: 'ADMIN' 을 booking_meta에 기록
        // → trg_on_booking_status_changed 에서 어드민 자신의 취소 시 IN_APP 알림 생성 안 함
        const cancelMeta = await bookingService.getBookingMeta(bookingId);
        await bookingService.updateBookingMeta(bookingId, { ...cancelMeta, cancelled_by: "ADMIN" });

        result = await bookingService.cancelBooking(bookingId);
        triggerProcessOutbox();
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

    console.log(JSON.stringify({
      layer: "api-route",
      operation: `booking-${action ?? "update"}`,
      durationMs: +(performance.now() - t0).toFixed(1),
      meta: { bookingId, action, hasUpdates: !!updates },
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.log(JSON.stringify({
      layer: "api-route",
      operation: `booking-${action ?? "update"}`,
      durationMs: +(performance.now() - t0).toFixed(1),
      error: (error as Error).message,
    }));
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
