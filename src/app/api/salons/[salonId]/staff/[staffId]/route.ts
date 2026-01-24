import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StaffService } from '@salon-admin/api-core';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Or Service Role if updating user data?
// Original file used ANON_KEY but implicitly? No, `StaffService` in original used `SUPABASE_SERVICE_ROLE_KEY` internally.
// The route file imported `StaffService` which had `createClient` inside it with Service Role Key.
// So here we MUST use SERVICE DATA KEY to maintain behavior for admin updates.

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string; staffId: string }> }
) {
  try {
    const { salonId, staffId } = await params;
    const body = await req.json();

    console.log(`Updating staff ${staffId} in salon ${salonId}`, body);

    const service = new StaffService(supabase);
    await service.updateStaff(salonId, staffId, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
