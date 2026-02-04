import { BaseRepository } from "./base.repository";
import {
  DBCustomer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types";

// Note: customers table schema in generated types is outdated, so we use 'any' cast

interface GetCustomersParams {
  salonId: string;
  filter?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface CustomerWithStats extends DBCustomer {
  total_spent?: number;
  latest_booking_date?: string;
  latest_booking_artist?: string;
}

export class CustomerRepository extends BaseRepository {
  async getCustomers(salonId: string): Promise<DBCustomer[]> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("salon_id", salonId);

    if (error) throw error;
    return (data || []) as DBCustomer[];
  }

  /**
   * 고객 목록 조회 (필터링, 정렬, 통계 포함)
   * - async-parallel: bookings 테이블과 조인하여 통계 계산
   * - server-parallel-fetching: 단일 쿼리로 모든 데이터 조회
   */
  async getCustomersWithStats(params: GetCustomersParams): Promise<{
    customers: CustomerWithStats[];
    total: number;
  }> {
    const {
      salonId,
      filter,
      search,
      sortBy = 'last_visit',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = params;

    // Base query with bookings aggregation
    let query = (this.supabase as any)
      .from('customers')
      .select(`
        *,
        bookings!left(
          id,
          booking_date,
          total_price,
          status,
          artist:users!bookings_artist_id_fkey(name)
        )
      `, { count: 'exact' })
      .eq('salon_id', salonId);

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply filters (will be processed in service layer)
    // - 'new': total_visits = 0
    // - 'returning': total_visits > 0
    // - 'regular': total_visits >= 5
    // - 'dormant': last_visit > 30 days ago
    // - 'vip': custom logic

    // Sort
    const sortColumn = sortBy === 'name' ? 'name' : 'last_visit';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      customers: (data || []) as CustomerWithStats[],
      total: count || 0,
    };
  }

  async getCustomer(id: string): Promise<DBCustomer> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as DBCustomer;
  }

  async findByPhone(salonId: string, phone: string): Promise<DBCustomer | null> {
    if (!phone) return null;

    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("salon_id", salonId)
      .eq("phone", phone)
      .maybeSingle();

    if (error) throw error;
    return data as DBCustomer | null;
  }

  async createCustomer(customer: CreateCustomerDto): Promise<DBCustomer> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    return data as DBCustomer;
  }

  async updateCustomer(id: string, updates: UpdateCustomerDto): Promise<DBCustomer> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as DBCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await (this.supabase as any)
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  /**
   * 고객의 예약 이력 조회
   * - async-parallel: 서비스, 아티스트 정보를 조인하여 조회
   */
  async getCustomerBookings(customerId: string): Promise<any[]> {
    const { data, error } = await (this.supabase as any)
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_price,
        status,
        customer_notes,
        staff_notes,
        service:services(id, name, name_en, name_th),
        artist:users!bookings_artist_id_fkey(id, name)
      `)
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
