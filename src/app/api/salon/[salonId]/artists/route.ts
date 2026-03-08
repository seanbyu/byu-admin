import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ArtistService } from '@/lib/api-core/services/artist.service';


/**
 * GET /api/salon/:salonId/artists
 * 살롱의 아티스트 목록 (공개)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const includePortfolio = req.nextUrl.searchParams.get('includePortfolio') === 'true';

    const supabase = createServiceClient();
    const service = new ArtistService(supabase as any);
    const data = await service.getArtists(salonId, includePortfolio);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch artists';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
