import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/salon/:salonId/designers
 * 살롱의 디자이너 목록 (공개)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const includePortfolio = searchParams.get('includePortfolio') === 'true';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 활성 디자이너 조회
    const { data: designers, error } = await supabase
      .from('staff_profiles')
      .select(`
        user_id,
        bio,
        specialties,
        years_of_experience,
        social_links,
        is_owner,
        display_order,
        users!staff_profiles_user_id_fkey (
          id,
          name,
          profile_image
        )
      `)
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // 포트폴리오 포함 요청 시
    let portfolioMap: Record<string, unknown[]> = {};

    if (includePortfolio && designers && designers.length > 0) {
      const designerIds = designers.map(d => d.user_id);

      const { data: portfolios } = await supabase
        .from('portfolio_items')
        .select('designer_id, id, image_url, thumbnail_url, caption')
        .in('designer_id', designerIds)
        .eq('is_public', true)
        .order('display_order', { ascending: true })
        .limit(6); // 디자이너당 최대 6개

      if (portfolios) {
        portfolios.forEach(p => {
          if (!portfolioMap[p.designer_id]) {
            portfolioMap[p.designer_id] = [];
          }
          portfolioMap[p.designer_id].push({
            id: p.id,
            imageUrl: p.image_url,
            thumbnailUrl: p.thumbnail_url,
            caption: p.caption,
          });
        });
      }
    }

    // 응답 형식 변환
    const result = (designers || []).map(d => {
      const user = d.users as { id: string; name: string; profile_image: string | null };

      return {
        id: user.id,
        name: user.name,
        profileImage: user.profile_image,
        bio: d.bio,
        specialties: d.specialties,
        yearsOfExperience: d.years_of_experience,
        socialLinks: d.social_links,
        isOwner: d.is_owner,
        displayOrder: d.display_order,
        portfolio: includePortfolio ? (portfolioMap[d.user_id] || []) : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Salon Designers GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch designers';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
