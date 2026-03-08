import { BaseRepository } from './base.repository';
import type { CustomerGroup } from '@/features/customers/types';

export class CustomerGroupRepository extends BaseRepository {
  async getCustomerGroups(salonId: string): Promise<CustomerGroup[]> {
    const { data, error } = await (this.supabase as any)
      .from('customer_groups')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as CustomerGroup[];
  }
}
