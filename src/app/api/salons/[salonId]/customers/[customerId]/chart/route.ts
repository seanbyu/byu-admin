import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CustomerService } from '@/lib/api-core';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string; customerId: string }> }
) {
  const { salonId, customerId } = await params;
  const supabase = createClient(req);
  const service = new CustomerService(supabase);

  try {
    const chartData = await service.getCustomerChart(salonId, customerId);
    return NextResponse.json({ success: true, data: chartData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
