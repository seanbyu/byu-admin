import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('salons')
      .select('id, name, description, address, phone, email, cover_image_url, settings')
      .eq('id', salonId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Transform to frontend format
    const settings = data.settings as Record<string, any> || {};
    const storeInfo = {
      id: data.id,
      name: data.name || '',
      ownerName: '',
      address: data.address || '',
      googleMapUrl: '',
      imageUrl: data.cover_image_url || '',
      phone: data.phone || '',
      email: data.email || '',
      description: data.description || '',
      instagramUrl: settings.instagram_url || '',
    };

    return NextResponse.json({
      success: true,
      data: storeInfo,
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

    // Transform from frontend format to DB format
    const updates: any = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.address !== undefined) updates.address = body.address;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    if (body.description !== undefined) updates.description = body.description;

    updates.updated_at = new Date().toISOString();

    // Instagram URL은 settings JSONB에 저장
    if (body.instagramUrl !== undefined) {
      // 기존 settings 가져오기
      const { data: currentData } = await supabase
        .from('salons')
        .select('settings')
        .eq('id', salonId)
        .single();

      const currentSettings = (currentData?.settings as Record<string, any>) || {};
      updates.settings = {
        ...currentSettings,
        instagram_url: body.instagramUrl,
      };
    }

    const { data, error } = await supabase
      .from('salons')
      .update(updates)
      .eq('id', salonId)
      .select('id, name, description, address, phone, email, cover_image_url, settings')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Transform to frontend format
    const settings = data.settings as Record<string, any> || {};
    const storeInfo = {
      id: data.id,
      name: data.name || '',
      ownerName: '',
      address: data.address || '',
      googleMapUrl: '',
      imageUrl: data.cover_image_url || '',
      phone: data.phone || '',
      email: data.email || '',
      description: data.description || '',
      instagramUrl: settings.instagram_url || '',
    };

    return NextResponse.json({
      success: true,
      data: storeInfo,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
