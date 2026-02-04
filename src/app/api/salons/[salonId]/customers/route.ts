import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CustomerService } from '@/lib/api-core';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const { salonId } = await params;
  const supabase = createClient(req);
  const service = new CustomerService(supabase);

  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    // 개별 고객 조회
    if (id) {
      const data = await service.getCustomer(id);
      return NextResponse.json({ success: true, data });
    }

    // 고객 목록 조회 (필터링, 정렬, 통계 포함)
    const filter = searchParams.get('filter') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sort_by') || 'last_visit';
    const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await service.getCustomersWithFilters(salonId, {
      filter,
      search,
      sortBy,
      sortOrder,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const { salonId } = await params;
  const supabase = createClient(req);
  const service = new CustomerService(supabase);
  const body = await req.json();

  try {
    const { action, ...data } = body;

    if (action === 'delete_customer') {
      await service.deleteCustomer(data.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'update_customer') {
      const result = await service.updateCustomer(data.id, data.updates);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'create_customer' || !action) {
      // 기존 고객이 있으면 반환, 없으면 새로 생성
      const result = await service.findOrCreateCustomer(salonId, data);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
