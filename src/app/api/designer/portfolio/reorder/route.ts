import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ReorderRequestBody {
  itemOrders: { itemId: string; displayOrder: number }[];
}

/**
 * PATCH /api/designer/portfolio/reorder
 * 포트폴리오 순서 변경
 */
export async function PATCH(req: NextRequest) {
  try {
    // 현재 로그인한 사용자 확인
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ReorderRequestBody = await req.json();
    const { itemOrders } = body;

    if (!itemOrders || itemOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No items to reorder' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 모든 아이템이 현재 사용자 소유인지 확인
    const itemIds = itemOrders.map(i => i.itemId);
    const { data: existingItems } = await supabase
      .from('portfolio_items')
      .select('id, designer_id')
      .in('id', itemIds);

    const validItems = existingItems?.filter(item => item.designer_id === user.id) || [];

    if (validItems.length !== itemIds.length) {
      return NextResponse.json(
        { success: false, message: 'Some items not found or unauthorized' },
        { status: 403 }
      );
    }

    // 순서 업데이트
    const updates = itemOrders.map(({ itemId, displayOrder }) =>
      supabase
        .from('portfolio_items')
        .update({
          display_order: displayOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('designer_id', user.id)
    );

    const results = await Promise.all(updates);

    const hasError = results.some(r => r.error);
    if (hasError) {
      throw new Error('Failed to update some items');
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio reordered successfully',
    });
  } catch (error) {
    console.error('Portfolio Reorder Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reorder';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
