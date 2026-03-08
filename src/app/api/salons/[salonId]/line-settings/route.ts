import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { LineSettingsService } from '@/lib/api-core/services/line-settings.service';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createServiceClient();
    const service = new LineSettingsService(supabase as any);
    const data = await service.getLineSettings(salonId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    const supabase = createServiceClient();
    const service = new LineSettingsService(supabase as any);
    let result;

    switch (action) {
      case 'upsert': {
        result = await service.upsertLineSettings(salonId, {
          lineChannelId: data.lineChannelId,
          lineChannelSecret: data.lineChannelSecret,
          lineChannelAccessToken: data.lineChannelAccessToken,
          liffId: data.liffId,
        });
        break;
      }

      case 'toggle_active': {
        await service.toggleActive(salonId, data.isActive);
        break;
      }

      case 'delete': {
        await service.deleteLineSettings(salonId);
        break;
      }

      case 'verify': {
        result = await service.verifyLineToken(salonId);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result ?? null });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status });
  }
}
