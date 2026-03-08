import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/ssr';
import { cookies } from 'next/headers';
import { ArtistService } from '@/lib/api-core';

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

    const body: UploadRequestBody = await req.json();
    const { imageUrl, caption, tags, isPublic } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const data = await service.uploadPortfolioItem(user.id, imageUrl, caption, tags, isPublic);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Portfolio Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
