import { BaseRepository } from './base.repository';
import type {
  CustomFilter,
  CreateCustomFilterDto,
  UpdateCustomFilterDto,
} from '@/features/customers/types/filter.types';

export class CustomerFilterRepository extends BaseRepository {
  async getFilters(salonId: string): Promise<CustomFilter[]> {
    const { data, error } = await (this.supabase as any)
      .from('customer_filters')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as CustomFilter[];
  }

  async createFilter(salonId: string, dto: CreateCustomFilterDto): Promise<CustomFilter> {
    // filter_key 중복 체크
    const { data: existing } = await (this.supabase as any)
      .from('customer_filters')
      .select('id')
      .eq('salon_id', salonId)
      .eq('filter_key', dto.filter_key)
      .single();

    if (existing) {
      throw Object.assign(new Error('Filter key already exists'), { status: 400 });
    }

    // 최대 display_order 조회
    const { data: maxOrderData } = await (this.supabase as any)
      .from('customer_filters')
      .select('display_order')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const maxOrder = maxOrderData?.display_order ?? -1;

    const { data: created, error } = await (this.supabase as any)
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

    if (error) throw error;
    return created as CustomFilter;
  }

  async updateFilter(id: string, updates: UpdateCustomFilterDto): Promise<CustomFilter> {
    const { data, error } = await (this.supabase as any)
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

    if (error) throw error;
    return data as CustomFilter;
  }

  async deleteFilter(id: string): Promise<void> {
    const { data: filter } = await (this.supabase as any)
      .from('customer_filters')
      .select('is_system_filter')
      .eq('id', id)
      .single();

    if (filter?.is_system_filter) {
      throw Object.assign(new Error('Cannot delete system filter'), { status: 400 });
    }

    const { error } = await (this.supabase as any)
      .from('customer_filters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async reorderFilters(filters: { id: string; display_order: number }[]): Promise<void> {
    for (const item of filters) {
      const { error } = await (this.supabase as any)
        .from('customer_filters')
        .update({ display_order: item.display_order })
        .eq('id', item.id);

      if (error) throw error;
    }
  }
}
