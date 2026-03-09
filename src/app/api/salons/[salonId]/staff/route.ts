import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { StaffService } from '@/lib/api-core';
import { checkPermission } from '@/lib/server/checkPermission';
import { unstable_cache, revalidateTag } from 'next/cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const staffList = await unstable_cache(
      async () => {
        const supabase = createServiceClient();
        const service = new StaffService(supabase);
        return service.getStaffList(salonId);
      },
      [`staff-${salonId}`],
      { tags: [`staff-${salonId}`], revalidate: 300 } // 5분
    )();

    return NextResponse.json({
      success: true,
      data: staffList,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: message === 'Salon ID is required' ? 400 : 500 }
    );
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
    const service = new StaffService(supabase);
    let result;

    switch (action) {
      case 'update_staff':
        result = await service.updateStaff(salonId, data.staffId, data.updates);
        break;
      case 'create_staff': {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '') || '';
        const permCheck = await checkPermission(token, salonId, 'staff', 'canWrite');
        if (!permCheck.authorized) {
          return NextResponse.json(
            { success: false, message: permCheck.error },
            { status: 403 }
          );
        }
        result = await service.createStaff(
          salonId,
          { email: data.email, name: data.name, role: data.role, password: data.password },
          permCheck.userId!
        );
        break;
      }
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    revalidateTag(`staff-${salonId}`, 'default');
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
