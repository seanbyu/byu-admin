import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/ssr';
import { cookies } from 'next/headers';
import { ArtistService } from '@/lib/api-core';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

/**
 * GET /api/designer/profile
 * 내 아티스트 프로필 조회
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const data = await service.getProfile(user.id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Artist Profile GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PUT /api/designer/profile
 * 아티스트 프로필 수정
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const data = await service.updateProfile(user.id, {
      name: body.name,
      phone: body.phone,
      profileImage: body.profileImage,
      bio: body.bio,
      specialties: body.specialties,
      yearsOfExperience: body.yearsOfExperience,
      socialLinks: body.socialLinks,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Artist Profile PUT Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
