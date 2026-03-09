import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CustomerGroupService } from '@/lib/api-core/services/customer-group.service';

// GET - 고객 그룹 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(req);
    const service = new CustomerGroupService(supabase);
    const data = await service.getCustomerGroups(salonId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch groups';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
