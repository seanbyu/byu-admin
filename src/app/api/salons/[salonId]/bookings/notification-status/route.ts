import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface BookingNotificationStatus {
  confirmed: boolean; // BOOKING_CONFIRMED or BOOKING_MODIFIED sent
  reminded: boolean;  // BOOKING_REMINDER sent
}

// GET /api/salons/[salonId]/bookings/notification-status?date=YYYY-MM-DD
// Returns { [bookingId]: BookingNotificationStatus }
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD

    if (!date) {
      return NextResponse.json(
        { success: false, message: 'date is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // notification_outbox에서 오늘 날짜 sent 건만 조회
    // idempotency_key 형식: {booking_id}:{type}:{YYYY-MM-DD}
    const { data, error } = await supabase
      .from('notification_outbox')
      .select('booking_id, notification_type, status')
      .eq('salon_id', salonId)
      .eq('channel', 'LINE')
      .in('notification_type', ['BOOKING_CONFIRMED', 'BOOKING_MODIFIED', 'BOOKING_REMINDER'])
      .like('idempotency_key', `%:${date}`)
      .in('status', ['sent', 'pending', 'sending']); // pending/sending도 발송 예정으로 표시

    if (error) throw new Error(error.message);

    // bookingId → status 맵 생성
    const statusMap: Record<string, BookingNotificationStatus> = {};

    for (const row of data ?? []) {
      if (!row.booking_id) continue;
      if (!statusMap[row.booking_id]) {
        statusMap[row.booking_id] = { confirmed: false, reminded: false };
      }
      if (row.notification_type === 'BOOKING_CONFIRMED' || row.notification_type === 'BOOKING_MODIFIED') {
        if (row.status === 'sent') statusMap[row.booking_id].confirmed = true;
      }
      if (row.notification_type === 'BOOKING_REMINDER') {
        statusMap[row.booking_id].reminded = row.status === 'sent';
      }
    }

    return NextResponse.json({ success: true, data: statusMap });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notification status';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
