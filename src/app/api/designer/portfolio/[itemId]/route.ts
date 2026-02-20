import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getCurrentUser() {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 소유권 확인
    const { data: existingItem } = await supabase
      .from('portfolio_items')
      .select('designer_id')
      .eq('id', itemId)
      .single();

    if (!existingItem || existingItem.designer_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Portfolio item not found or unauthorized' },
        { status: 404 }
      );
    }

    // 업데이트 가능한 필드만 추출
    const updates: Record<string, unknown> = {};
    if (body.caption !== undefined) updates.caption = body.caption;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.isPublic !== undefined) updates.is_public = body.isPublic;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('portfolio_items')
      .update(updates)
      .eq('id', itemId)
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
    console.error('Portfolio Update Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/designer/portfolio/:itemId
 * 포트폴리오 아이템 삭제
 */
export async function DELETE(
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 소유권 확인 및 삭제
    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', itemId)
      .eq('designer_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio item deleted',
    });
  } catch (error) {
    console.error('Portfolio Delete Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
