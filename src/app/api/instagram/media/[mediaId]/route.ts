import { NextRequest, NextResponse } from 'next/server';
import { createInstagramClient } from '@/lib/instagram';

/**
 * GET /api/instagram/media/:mediaId
 * 특정 Instagram 미디어 상세 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const instagram = createInstagramClient();

    // 미디어 상세 조회
    const media = await instagram.getMediaById(mediaId);

    return NextResponse.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error('Instagram Media Detail API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch media';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
