import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createInstagramClient } from '@/lib/instagram';
import type { InstagramMedia } from '@/lib/instagram';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ImportRequestBody {
  mediaIds: string[];
  designerId: string;
}

/**
 * POST /api/instagram/import
 * 선택한 Instagram 미디어를 포트폴리오로 임포트
 */
export async function POST(req: NextRequest) {
  try {
    const body: ImportRequestBody = await req.json();
    const { mediaIds, designerId } = body;

    if (!mediaIds || mediaIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No media selected' },
        { status: 400 }
      );
    }

    if (!designerId) {
      return NextResponse.json(
        { success: false, message: 'Designer ID is required' },
        { status: 400 }
      );
    }

    const instagram = createInstagramClient();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Instagram에서 미디어 상세 정보 가져오기
    const mediaList: InstagramMedia[] = await instagram.getMediaByIds(mediaIds);

    // 현재 최대 display_order 조회
    const { data: existingItems } = await supabase
      .from('portfolio_items')
      .select('display_order')
      .eq('designer_id', designerId)
      .order('display_order', { ascending: false })
      .limit(1);

    let nextOrder = (existingItems?.[0]?.display_order ?? -1) + 1;

    // 포트폴리오 아이템으로 변환
    const portfolioItems = mediaList.map((media) => ({
      designer_id: designerId,
      source_type: 'instagram',
      source_id: media.id,
      image_url: media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url,
      thumbnail_url: media.thumbnail_url || media.media_url,
      caption: media.caption || null,
      display_order: nextOrder++,
      is_public: true,
      instagram_permalink: media.permalink || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 중복 체크 (이미 임포트된 미디어 제외)
    const { data: existingMedia } = await supabase
      .from('portfolio_items')
      .select('source_id')
      .eq('designer_id', designerId)
      .eq('source_type', 'instagram')
      .in('source_id', mediaIds);

    const existingSourceIds = new Set(existingMedia?.map(m => m.source_id) || []);
    const newItems = portfolioItems.filter(item => !existingSourceIds.has(item.source_id));

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All selected media already imported',
        data: { imported: 0, skipped: mediaIds.length },
      });
    }

    // DB에 저장
    const { data: insertedItems, error } = await supabase
      .from('portfolio_items')
      .insert(newItems)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: insertedItems?.length || 0,
        skipped: mediaIds.length - newItems.length,
        items: insertedItems,
      },
    });
  } catch (error) {
    console.error('Instagram Import API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to import media';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
