import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('staff_positions')
      .select('id, salon_id, name, name_en, name_th, level, display_order, is_active, created_at, updated_at')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);

    // Transform to frontend format
    const positions = (data || []).map((p) => ({
      id: p.id,
      salonId: p.salon_id,
      name: p.name,
      name_en: p.name_en,
      name_th: p.name_th,
      rank: p.level,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: positions,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('staff_positions')
      .insert({
        salon_id: salonId,
        name: body.name,
        name_en: body.name_en || '',
        name_th: body.name_th || '',
        level: body.rank || 1,
        display_order: body.displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        salonId: data.salon_id,
        name: data.name,
        name_en: data.name_en,
        name_th: data.name_th,
        rank: data.level,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
