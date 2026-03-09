import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { SettingsService } from '@/lib/api-core';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const supabase = createServiceClient();
    const service = new SettingsService(supabase);
    const data = await service.getSalonInfo(salonId);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body = await req.json();

    const supabase = createServiceClient();
    const service = new SettingsService(supabase);
    const data = await service.updateSalonInfo(salonId, {
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      description: body.description,
      instagramUrl: body.instagramUrl,
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
