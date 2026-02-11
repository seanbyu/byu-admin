import { NextRequest, NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/instagram';

/**
 * GET /api/instagram/media
 * Instagram 미디어 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const after = searchParams.get('after') || undefined;

    const instagram = createInstagramClient();

    // 미디어 목록 조회
    const mediaResponse = await instagram.getMedia(limit, after);

    return NextResponse.json({
      success: true,
      data: {
        media: mediaResponse.data,
        paging: mediaResponse.paging,
      },
    });
  } catch (error) {
    console.error('Instagram Media API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch media';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
