import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BookingService } from '@salon-admin/api-core';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const { searchParams } = new URL(req.url); // Use filters if needed

    const supabase = createClient(req);
    const service = new BookingService(supabase);
    // BookingService.getBookings(salonId) in api-core
    const bookings = await service.getBookings(salonId);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
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

    const supabase = createClient(req);
    const service = new BookingService(supabase);
    let result;

    if (action) {
      switch (action) {
        case 'cancel_booking':
          result = await service.cancelBooking(data.id);
          break;
        case 'complete_booking':
          result = await service.completeBooking(data.id);
          break;
        case 'update_booking': // If explicit update needed
          result = await service.updateBooking(data.id, data.updates);
          break;
        case 'create_booking':
          result = await service.createBooking(salonId, data);
          break;
        default:
          return NextResponse.json(
            { success: false, message: 'Invalid action' },
            { status: 400 }
          );
      }
    } else {
      // Legacy support: default to create if no action for backward compatibility
      // Or assume body IS the booking data
      result = await service.createBooking(salonId, body);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
