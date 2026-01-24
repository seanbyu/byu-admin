import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CustomerService } from '@salon-admin/api-core';

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

    if (id) {
      const data = await service.getCustomer(id);
      return NextResponse.json({ success: true, data });
    }

    const data = await service.getCustomers(salonId);
    return NextResponse.json({ success: true, data });
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
      const result = await service.createCustomer(salonId, data);
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
