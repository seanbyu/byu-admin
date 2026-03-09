/**
 * /api/salons/[salonId]/bookings
 *
 * GET  — 예약 목록 조회
 * POST — 예약 생성
 *
 * 단건 작업(수정/취소/확정/삭제)은 /[bookingId]/route.ts 참고
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BookingService } from "@/lib/api-core";
import { handleApiError, requireField } from "@/lib/errors";

type RouteContext = { params: Promise<{ salonId: string }> };

// ─────────────────────────────────────────
// GET /api/salons/[salonId]/bookings
// ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId } = await params;
    requireField(salonId, "salonId");

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const salesOnly = searchParams.get('sales_only') === 'true';

    const supabase = createClient(req);
    const service = new BookingService(supabase);
    const bookings = await service.getBookings(salonId, { startDate, endDate, salesOnly });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────
// POST /api/salons/[salonId]/bookings
// ─────────────────────────────────────────
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId } = await params;
    requireField(salonId, "salonId");

    const body = await req.json();
    const supabase = createClient(req);
    const service = new BookingService(supabase);
    const result = await service.createBooking(salonId, body);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
