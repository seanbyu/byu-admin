import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/designers/:designerId/portfolio
 * 공개 포트폴리오 조회 (인증 불필요)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ designerId: string }> }
) {
  try {
    const { designerId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 공개 포트폴리오만 조회
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('id, image_url, thumbnail_url, caption, tags, display_order, created_at')
      .eq('designer_id', designerId)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Public Portfolio GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch portfolio';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
