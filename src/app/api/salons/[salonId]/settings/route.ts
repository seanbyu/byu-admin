import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { unstable_cache, revalidateTag } from 'next/cache';
import { SettingsService } from '@/lib/api-core/services/settings.service';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const data = await unstable_cache(
      async () => {
        const supabase = createServiceClient();
        const service = new SettingsService(supabase as any);
        return service.getSalonSettings(salonId);
      },
      [`settings-${salonId}`],
      { tags: [`settings-${salonId}`], revalidate: 600 }
    )();

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
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
    const service = new SettingsService(supabase as any);

    await service.updateSalonSettings(salonId, {
      businessHours: body.businessHours,
      holidays: body.holidays,
      settings: body.settings,
    });

    revalidateTag(`settings-${salonId}`, 'default');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
