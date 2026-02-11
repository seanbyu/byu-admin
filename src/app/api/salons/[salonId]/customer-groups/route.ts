import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CustomerGroup } from '@/features/customers/types';

// ============================================
// GET - 고객 그룹 목록 조회
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(req);

    const { data, error } = await supabase
      .from('customer_groups')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Customer groups query error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data as CustomerGroup[],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch groups';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
