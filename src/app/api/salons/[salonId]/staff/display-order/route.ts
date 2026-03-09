import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { StaffService } from '@/lib/api-core/services/staff.service';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    await params; // salonId 사용하지 않지만 미래 확장을 위해 유지
    const body = await request.json();
    const { staffOrders } = body as { staffOrders: { staffId: string; displayOrder: number }[] };

    if (!staffOrders || !Array.isArray(staffOrders) || staffOrders.length === 0) {
      return NextResponse.json(
        { error: 'staffOrders array is required' },
        { status: 400 }
      );
    }

    for (const item of staffOrders) {
      if (!item.staffId || typeof item.displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have staffId and displayOrder' },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceClient();
    const service = new StaffService(supabase);
    await service.updateStaffDisplayOrder(staffOrders);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
