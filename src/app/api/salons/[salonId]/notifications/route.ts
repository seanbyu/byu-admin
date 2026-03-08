/**
 * /api/salons/[salonId]/notifications
 *
 * GET   — 알림 목록 조회 + 미읽음 카운트
 * PATCH — 알림 읽음 처리 (단건 or 전체)
 * DELETE — 알림 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationPanelService } from "@/lib/api-core/services/notification-panel.service";
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
    const service = new NotificationPanelService(supabase);

    if (unreadOnly) {
      const unreadCount = await service.countUnread(salonId);
      return NextResponse.json({ success: true, data: { unreadCount } });
    }

    const data = await service.getAdminNotifications(salonId, limit);
    return NextResponse.json({ success: true, data });
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
    const service = new NotificationPanelService(supabase);
    await service.markAsRead(salonId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────
// DELETE /api/salons/[salonId]/notifications
// Query: ?id=...
// ─────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { salonId } = await params;
    requireField(salonId, "salonId");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? undefined;
    requireField(id, "id");

    const supabase = createClient(req);
    const service = new NotificationPanelService(supabase);
    await service.deleteNotification(salonId, id!);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
