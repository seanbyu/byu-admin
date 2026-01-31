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
      .select('id, name, description, address, phone, email, images, instagram_url')
      .eq('id', salonId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Transform to frontend format
    const storeInfo = {
      id: data.id,
      name: data.name || '',
      ownerName: '', // Not stored in salons table
      address: data.address || '',
      googleMapUrl: '', // Not in current schema
      imageUrl: data.images?.[0] || '',
      phone: data.phone || '',
      email: data.email || '',
      description: data.description || '',
      instagramUrl: data.instagram_url || '',
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
    if (body.instagramUrl !== undefined) updates.instagram_url = body.instagramUrl;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('salons')
      .update(updates)
      .eq('id', salonId)
      .select('id, name, description, address, phone, email, images, instagram_url')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Transform to frontend format
    const storeInfo = {
      id: data.id,
      name: data.name || '',
      ownerName: '',
      address: data.address || '',
      googleMapUrl: '',
      imageUrl: data.images?.[0] || '',
      phone: data.phone || '',
      email: data.email || '',
      description: data.description || '',
      instagramUrl: data.instagram_url || '',
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
