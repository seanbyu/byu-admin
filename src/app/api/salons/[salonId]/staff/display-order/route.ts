import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface StaffOrderItem {
  staffId: string;
  displayOrder: number;
}

interface UpdateDisplayOrderRequest {
  staffOrders: StaffOrderItem[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body: UpdateDisplayOrderRequest = await request.json();
    const { staffOrders } = body;

    // Validation
    if (!staffOrders || !Array.isArray(staffOrders) || staffOrders.length === 0) {
      return NextResponse.json(
        { error: 'staffOrders array is required' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of staffOrders) {
      if (!item.staffId || typeof item.displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have staffId and displayOrder' },
          { status: 400 }
        );
      }
    }

    // Update each staff's display_order
    const updates = staffOrders.map(({ staffId, displayOrder }) =>
      supabaseAdmin
        .from('staff_profiles')
        .update({ display_order: displayOrder })
        .eq('user_id', staffId)
        .eq('salon_id', salonId)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Failed to update display order:', errors);
      return NextResponse.json(
        { error: 'Failed to update some staff display orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Display order updated successfully',
    });
  } catch (error) {
    console.error('Update display order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
