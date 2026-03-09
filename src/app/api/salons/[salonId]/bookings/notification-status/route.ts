import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { NotificationPanelService } from '@/lib/api-core/services/notification-panel.service';

export type { BookingNotificationStatus } from '@/lib/api-core/repositories/notification.repository';


// GET /api/salons/[salonId]/bookings/notification-status?date=YYYY-MM-DD
// Returns { [bookingId]: BookingNotificationStatus }
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, message: 'date is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const service = new NotificationPanelService(supabase);
    const statusMap = await service.getBookingNotificationStatuses(salonId, date);

    return NextResponse.json({ success: true, data: statusMap });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notification status';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
