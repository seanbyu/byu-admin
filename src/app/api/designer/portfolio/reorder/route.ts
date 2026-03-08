import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/ssr';
import { cookies } from 'next/headers';
import { ArtistService } from '@/lib/api-core';

interface ReorderRequestBody {
  itemOrders: { itemId: string; displayOrder: number }[];
}

/**
 * PATCH /api/designer/portfolio/reorder
 * 포트폴리오 순서 변경
 */
export async function PATCH(req: NextRequest) {
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

    const body: ReorderRequestBody = await req.json();
    const { itemOrders } = body;

    if (!itemOrders || itemOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No items to reorder' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const service = new ArtistService(supabase);
    await service.reorderPortfolio(user.id, itemOrders);

    return NextResponse.json({ success: true, message: 'Portfolio reordered successfully' });
  } catch (error: any) {
    console.error('Portfolio Reorder Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reorder';
    const status = error?.status === 403 ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
