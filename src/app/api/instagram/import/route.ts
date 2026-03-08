import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createInstagramClient } from '@/lib/instagram';
import { ArtistService } from '@/lib/api-core';

interface ImportRequestBody {
  mediaIds: string[];
  artistId: string;
}

/**
 * POST /api/instagram/import
 * 선택한 Instagram 미디어를 포트폴리오로 임포트
 */
export async function POST(req: NextRequest) {
  try {
    const body: ImportRequestBody = await req.json();
    const { mediaIds, artistId } = body;

    if (!mediaIds || mediaIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No media selected' },
        { status: 400 }
      );
    }

    if (!artistId) {
      return NextResponse.json(
        { success: false, message: 'Artist ID is required' },
        { status: 400 }
      );
    }

    const instagram = createInstagramClient();
    const mediaList = await instagram.getMediaByIds(mediaIds);

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const result = await service.importInstagramMedia(artistId, mediaList);

    if (result.imported === 0) {
      return NextResponse.json({
        success: true,
        message: 'All selected media already imported',
        data: result,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Instagram Import API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to import media';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
