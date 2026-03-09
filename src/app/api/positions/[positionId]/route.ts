import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { PositionService } from '@/lib/api-core';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const { positionId } = await params;
    const body = await req.json();

    const supabase = createServiceClient();
    const service = new PositionService(supabase);
    const data = await service.updatePosition(positionId, {
      name: body.name,
      name_en: body.name_en,
      name_th: body.name_th,
      rank: body.rank,
      displayOrder: body.displayOrder,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const { positionId } = await params;

    const supabase = createServiceClient();
    const service = new PositionService(supabase);
    await service.deletePosition(positionId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
