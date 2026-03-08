import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/ssr';
import { cookies } from 'next/headers';
import { ArtistService } from '@/lib/api-core';

/**
 * GET /api/designer/portfolio
 * 내 포트폴리오 조회 (로그인 필요)
 */
export async function GET(_req: NextRequest) {
  try {
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const data = await service.getMyPortfolio(user.id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Portfolio GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch portfolio';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
