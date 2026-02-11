import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface UploadRequestBody {
  imageUrl: string;
  caption?: string;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * POST /api/designer/portfolio/upload
 * 수동 포트폴리오 업로드
 */
export async function POST(req: NextRequest) {
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

    const body: UploadRequestBody = await req.json();
    const { imageUrl, caption, tags, isPublic = true } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 현재 최대 display_order 조회
    const { data: existingItems } = await supabase
      .from('portfolio_items')
      .select('display_order')
      .eq('designer_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existingItems?.[0]?.display_order ?? -1) + 1;

    // 포트폴리오 아이템 생성
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert({
        designer_id: user.id,
        source_type: 'manual',
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        caption: caption || null,
        tags: tags || null,
        display_order: nextOrder,
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Portfolio Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
