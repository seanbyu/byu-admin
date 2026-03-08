import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ArtistService } from '@/lib/api-core';

/**
 * GET /api/artists/:artistId/portfolio
 * 공개 포트폴리오 조회 (인증 불필요)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const data = await service.getPublicPortfolio(artistId);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch portfolio';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
