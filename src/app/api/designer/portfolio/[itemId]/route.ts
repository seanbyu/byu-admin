import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/ssr';
import { cookies } from 'next/headers';
import { ArtistService } from '@/lib/api-core';

async function getCurrentUser() {
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
  return user;
}

/**
 * PUT /api/designer/portfolio/:itemId
 * 포트폴리오 아이템 메타데이터 수정
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemId } = await params;
    const body = await req.json();

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    const data = await service.updatePortfolioItem(user.id, itemId, {
      caption: body.caption,
      tags: body.tags,
      isPublic: body.isPublic,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Portfolio Update Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update';
    const status = error?.status === 404 ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * DELETE /api/designer/portfolio/:itemId
 * 포트폴리오 아이템 삭제
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { itemId } = await params;

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    await service.deletePortfolioItem(user.id, itemId);

    return NextResponse.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    console.error('Portfolio Delete Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
