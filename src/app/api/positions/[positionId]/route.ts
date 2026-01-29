import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const { positionId } = await params;
    const body = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.name_en !== undefined) updates.name_en = body.name_en || '';
    if (body.name_th !== undefined) updates.name_th = body.name_th || '';
    if (body.rank !== undefined) updates.level = body.rank;
    if (body.displayOrder !== undefined) updates.display_order = body.displayOrder;

    const { data, error } = await supabase
      .from('staff_positions')
      .update(updates)
      .eq('id', positionId)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ positionId: string }> }
) {
  try {
    const { positionId } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hard delete - 완전 삭제
    const { error } = await supabase
      .from('staff_positions')
      .delete()
      .eq('id', positionId);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
