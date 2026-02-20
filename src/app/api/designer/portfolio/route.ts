import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/designer/portfolio
 * 내 포트폴리오 조회 (로그인 필요)
 */
export async function GET(req: NextRequest) {
  try {
    // 현재 로그인한 사용자 확인
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 포트폴리오 조회
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('designer_id', user.id)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Portfolio GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch portfolio';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
