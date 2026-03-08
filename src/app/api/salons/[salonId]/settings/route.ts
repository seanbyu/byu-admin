import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache, revalidateTag } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const data = await unstable_cache(
      async () => {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from('salons')
          .select('id, business_hours, holidays, settings')
          .eq('id', salonId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
      [`settings-${salonId}`],
      { tags: [`settings-${salonId}`], revalidate: 600 } // 10분
    )();

    const businessHours = transformBusinessHoursFromDB(data.business_hours);
    const holidays = data.holidays || [];

    return NextResponse.json({
      success: true,
      data: {
        businessHours,
        holidays,
        settings: data.settings,
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updates: any = {};

    // Handle businessHours update
    if (body.businessHours) {
      updates.business_hours = transformBusinessHoursToDB(body.businessHours);
    }

    // Handle holidays update
    if (body.holidays !== undefined) {
      updates.holidays = body.holidays;
    }

    // Handle settings update (merge with existing settings)
    if (body.settings) {
      // Fetch current settings to merge
      const { data: currentData } = await supabase
        .from('salons')
        .select('settings')
        .eq('id', salonId)
        .single();

      const currentSettings = currentData?.settings || {};
      updates.settings = {
        ...currentSettings,
        ...body.settings,
      };
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('salons')
      .update(updates)
      .eq('id', salonId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateTag(`settings-${salonId}`, 'default');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Transform DB format to frontend format
function transformBusinessHoursFromDB(dbHours: any): any[] {
  if (!dbHours) return getDefaultBusinessHours();

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return Object.entries(dbHours).map(([day, value]: [string, any]) => ({
    dayOfWeek: dayMap[day] ?? 0,
    openTime: value.open || '10:00',
    closeTime: value.close || '20:00',
    isOpen: value.enabled ?? false,
  })).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

// Transform frontend format to DB format
function transformBusinessHoursToDB(frontendHours: any[]): any {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const result: any = {};
  frontendHours.forEach((hour) => {
    const dayName = dayNames[hour.dayOfWeek];
    result[dayName] = {
      enabled: hour.isOpen,
      open: hour.isOpen ? hour.openTime : null,
      close: hour.isOpen ? hour.closeTime : null,
    };
  });

  return result;
}

function getDefaultBusinessHours(): any[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '10:00',
    closeTime: '20:00',
    isOpen: i !== 0,
  }));
}
