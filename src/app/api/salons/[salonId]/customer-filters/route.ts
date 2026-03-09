import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { unstable_cache, revalidateTag } from 'next/cache';
import { CustomerFilterService } from '@/lib/api-core/services/customer-filter.service';
import type {
  CreateCustomFilterDto,
  UpdateCustomFilterDto,
} from '@/features/customers/types/filter.types';


// ============================================
// GET - 필터 목록 조회
// ============================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;

    const data = await unstable_cache(
      async () => {
        const supabase = createServiceClient();
        const service = new CustomerFilterService(supabase);
        return service.getFilters(salonId);
      },
      [`customer-filters-${salonId}`],
      { tags: [`customer-filters-${salonId}`], revalidate: 600 }
    )();

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch filters';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ============================================
// POST - 필터 생성/수정/삭제/순서변경
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createServiceClient();
    const service = new CustomerFilterService(supabase);
    const body = await req.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'create': {
        result = await service.createFilter(salonId, data as CreateCustomFilterDto);
        break;
      }

      case 'update': {
        const { id, updates } = data as { id: string; updates: UpdateCustomFilterDto };
        result = await service.updateFilter(id, updates);
        break;
      }

      case 'delete': {
        const { id } = data as { id: string };
        await service.deleteFilter(id);
        break;
      }

      case 'reorder': {
        const { filters } = data as { filters: { id: string; display_order: number }[] };
        await service.reorderFilters(filters);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    revalidateTag(`customer-filters-${salonId}`, 'default');
    return NextResponse.json({ success: true, data: result ?? null });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : 'Operation failed';
    return NextResponse.json({ success: false, message }, { status });
  }
}
