import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { PositionService } from '@/lib/api-core/services/position.service';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createServiceClient();
    const service = new PositionService(supabase as any);
    const data = await service.getPositions(salonId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body = await req.json();
    const supabase = createServiceClient();
    const service = new PositionService(supabase as any);
    const data = await service.createPosition(salonId, {
      name: body.name,
      name_en: body.name_en,
      name_th: body.name_th,
      rank: body.rank,
      displayOrder: body.displayOrder,
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
