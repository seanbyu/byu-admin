import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { StaffService } from '@/lib/api-core';
import { checkPermission } from '@/lib/server/checkPermission';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string; staffId: string }> }
) {
  try {
    const { salonId, staffId } = await params;
    const body = await req.json();

    const supabase = createServiceClient();
    const service = new StaffService(supabase);
    await service.updateStaff(salonId, staffId, body);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string; staffId: string }> }
) {
  try {
    const { salonId, staffId } = await params;
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const permCheck = await checkPermission(token, salonId, 'staff', 'canDelete');
    if (!permCheck.authorized) {
      return NextResponse.json({ success: false, message: permCheck.error }, { status: 403 });
    }

    const supabase = createServiceClient();
    const service = new StaffService(supabase);
    await service.hardDeleteStaff(staffId, salonId, permCheck.userId!);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const isBusinessError = message.startsWith('ERROR_');
    return NextResponse.json(
      { success: false, message },
      { status: isBusinessError ? 400 : 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string; staffId: string }> }
) {
  try {
    const { salonId, staffId } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    const supabase = createServiceClient();
    const service = new StaffService(supabase);

    switch (action) {
      case 'soft_delete': {
        const permCheck = await checkPermission(token, salonId, 'staff', 'canWrite');
        if (!permCheck.authorized) {
          return NextResponse.json({ success: false, message: permCheck.error }, { status: 403 });
        }
        await service.softDeleteStaff(staffId, salonId, permCheck.userId!);
        break;
      }
      case 'cancel_resignation': {
        const permCheck = await checkPermission(token, salonId, 'staff', 'canWrite');
        if (!permCheck.authorized) {
          return NextResponse.json({ success: false, message: permCheck.error }, { status: 403 });
        }
        await service.cancelResignation(staffId);
        break;
      }
      case 'update_role': {
        const permCheck = await checkPermission(token, salonId, 'staff', 'canWrite');
        if (!permCheck.authorized) {
          return NextResponse.json({ success: false, message: permCheck.error }, { status: 403 });
        }
        await service.updateStaffRole(staffId, data.role);
        break;
      }
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const isBusinessError = message.startsWith('ERROR_');
    return NextResponse.json(
      { success: false, message },
      { status: isBusinessError ? 400 : 500 }
    );
  }
}
