/**
 * /api/salons/[salonId]/notifications
 *
 * GET   — 알림 목록 조회 + 미읽음 카운트
 * PATCH — 알림 읽음 처리 (단건 or 전체)
 * DELETE — 알림 삭제
 *
 * 클라이언트에서 Supabase 직접 접근 제거 → 이 Route 경유
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, requireField } from "@/lib/errors";

type RouteContext = { params: Promise<{ salonId: string }> };

// ─────────────────────────────────────────
// GET /api/salons/[salonId]/notifications
// Query: ?limit=10&unread_count=true
// ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId } = await params;
    requireField(salonId, "salonId");

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 10);
    const unreadOnly = searchParams.get("unread_count") === "true";

    const supabase = createClient(req);

    if (unreadOnly) {
      // 미읽음 카운트만 반환
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", salonId)
        .eq("recipient_type", "ADMIN")
        .eq("channel", "IN_APP")
        .neq("status", "FAILED")
        .is("read_at", null);

      if (error) throw error;
      return NextResponse.json({ success: true, data: { unreadCount: count ?? 0 } });
    }

    // 알림 목록 조회
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, notification_type, status, created_at, read_at, booking_id, metadata")
      .eq("salon_id", salonId)
      .eq("recipient_type", "ADMIN")
      .eq("channel", "IN_APP")
      .neq("status", "FAILED")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────
// PATCH /api/salons/[salonId]/notifications
// Body: { id?: string }  — id 없으면 전체 읽음
// ─────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId } = await params;
    requireField(salonId, "salonId");

    const body = await req.json().catch(() => ({}));
    const { id } = body as { id?: string };

    const supabase = createClient(req);
    const readAt = new Date().toISOString();

    let query = supabase
      .from("notifications")
      .update({ read_at: readAt } as never)
      .eq("salon_id", salonId)
      .eq("channel", "IN_APP")
      .is("read_at", null);

    if (id) {
      query = query.eq("id", id);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────
// DELETE /api/salons/[salonId]/notifications
// Body: { id: string }
// ─────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId } = await params;
    requireField(salonId, "salonId");

    const body = await req.json();
    const { id } = body as { id: string };
    requireField(id, "id");

    const supabase = createClient(req);
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("salon_id", salonId); // salonId로 소유권 검증

    if (error) throw error;
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
