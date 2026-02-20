import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    supabaseUrl,
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
 * 내 디자이너 프로필 조회
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 사용자 정보 + staff_profiles 조회
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        profile_image,
        staff_profiles!staff_profiles_user_id_fkey (
          bio,
          specialties,
          years_of_experience,
          social_links,
          salon_id,
          is_owner
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // 프로필 형식으로 변환
    const staffProfile = Array.isArray(data.staff_profiles)
      ? data.staff_profiles[0]
      : data.staff_profiles;

    const profile = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      profileImage: data.profile_image,
      bio: staffProfile?.bio || '',
      specialties: staffProfile?.specialties || [],
      yearsOfExperience: staffProfile?.years_of_experience || 0,
      socialLinks: staffProfile?.social_links || {},
      salonId: staffProfile?.salon_id,
      isOwner: staffProfile?.is_owner || false,
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Designer Profile GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/designer/profile
 * 디자이너 프로필 수정
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // users 테이블 업데이트
    const userUpdates: Record<string, unknown> = {};
    if (body.name !== undefined) userUpdates.name = body.name;
    if (body.phone !== undefined) userUpdates.phone = body.phone;
    if (body.profileImage !== undefined) userUpdates.profile_image = body.profileImage;
    userUpdates.updated_at = new Date().toISOString();

    if (Object.keys(userUpdates).length > 1) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (userError) {
        throw new Error(userError.message);
      }
    }

    // staff_profiles 테이블 업데이트
    const staffUpdates: Record<string, unknown> = {};
    if (body.bio !== undefined) staffUpdates.bio = body.bio;
    if (body.specialties !== undefined) staffUpdates.specialties = body.specialties;
    if (body.yearsOfExperience !== undefined) staffUpdates.years_of_experience = body.yearsOfExperience;
    if (body.socialLinks !== undefined) staffUpdates.social_links = body.socialLinks;
    staffUpdates.updated_at = new Date().toISOString();

    if (Object.keys(staffUpdates).length > 1) {
      const { error: staffError } = await supabase
        .from('staff_profiles')
        .update(staffUpdates)
        .eq('user_id', user.id);

      if (staffError) {
        throw new Error(staffError.message);
      }
    }

    // 업데이트된 프로필 조회
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        profile_image,
        staff_profiles!staff_profiles_user_id_fkey (
          bio,
          specialties,
          years_of_experience,
          social_links,
          salon_id,
          is_owner
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const staffProfile = Array.isArray(data.staff_profiles)
      ? data.staff_profiles[0]
      : data.staff_profiles;

    const profile = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      profileImage: data.profile_image,
      bio: staffProfile?.bio || '',
      specialties: staffProfile?.specialties || [],
      yearsOfExperience: staffProfile?.years_of_experience || 0,
      socialLinks: staffProfile?.social_links || {},
      salonId: staffProfile?.salon_id,
      isOwner: staffProfile?.is_owner || false,
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Designer Profile PUT Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
