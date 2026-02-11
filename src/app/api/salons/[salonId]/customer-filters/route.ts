import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  CustomFilter,
  CreateCustomFilterDto,
  UpdateCustomFilterDto,
} from '@/features/customers/types/filter.types';

// ============================================
// GET - 필터 목록 조회
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params;
    const supabase = createClient(req);

    const { data, error } = await supabase
      .from('customer_filters')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Customer filters query error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data as CustomFilter[],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch filters';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
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
    const supabase = createClient(req);
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      // 새 필터 생성
      case 'create': {
        const dto = data as CreateCustomFilterDto;

        // filter_key 중복 체크
        const { data: existing } = await supabase
          .from('customer_filters')
          .select('id')
          .eq('salon_id', salonId)
          .eq('filter_key', dto.filter_key)
          .single();

        if (existing) {
          return NextResponse.json(
            { success: false, message: 'Filter key already exists' },
            { status: 400 }
          );
        }

        // 최대 display_order 조회
        const { data: maxOrderData } = await supabase
          .from('customer_filters')
          .select('display_order')
          .eq('salon_id', salonId)
          .order('display_order', { ascending: false })
          .limit(1)
          .single();

        const maxOrder = maxOrderData?.display_order ?? -1;

        const { data: created, error: createError } = await supabase
          .from('customer_filters')
          .insert({
            salon_id: salonId,
            filter_key: dto.filter_key,
            is_system_filter: false,
            label: dto.label,
            label_en: dto.label_en,
            label_th: dto.label_th,
            conditions: dto.conditions,
            condition_logic: dto.condition_logic || 'AND',
            display_order: maxOrder + 1,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        return NextResponse.json({ success: true, data: created });
      }

      // 필터 수정
      case 'update': {
        const { id, updates } = data as { id: string; updates: UpdateCustomFilterDto };

        const { data: updated, error: updateError } = await supabase
          .from('customer_filters')
          .update({
            label: updates.label,
            label_en: updates.label_en,
            label_th: updates.label_th,
            conditions: updates.conditions,
            condition_logic: updates.condition_logic,
            display_order: updates.display_order,
            is_active: updates.is_active,
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        return NextResponse.json({ success: true, data: updated });
      }

      // 필터 삭제
      case 'delete': {
        const { id } = data as { id: string };

        // 시스템 필터인지 확인
        const { data: filter } = await supabase
          .from('customer_filters')
          .select('is_system_filter')
          .eq('id', id)
          .single();

        if (filter?.is_system_filter) {
          return NextResponse.json(
            { success: false, message: 'Cannot delete system filter' },
            { status: 400 }
          );
        }

        const { error: deleteError } = await supabase
          .from('customer_filters')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        return NextResponse.json({ success: true });
      }

      // 순서 변경
      case 'reorder': {
        const { filters } = data as { filters: { id: string; display_order: number }[] };

        // 트랜잭션처럼 모두 업데이트
        for (const item of filters) {
          const { error: reorderError } = await supabase
            .from('customer_filters')
            .update({ display_order: item.display_order })
            .eq('id', item.id);

          if (reorderError) {
            throw new Error(reorderError.message);
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
