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
  // Joined primary artist data
  primary_artist_user?: {
    id: string;
    name: string;
  } | null;
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

    // Base query with bookings aggregation and primary artist join
    let query = (this.supabase as any)
      .from('customers')
      .select(`
        *,
        primary_artist_user:users!customers_primary_artist_id_fkey(id, name),
        bookings!left(
          id,
          booking_date,
          total_price,
          product_amount,
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

  async getCustomer(id: string): Promise<DBCustomer & { primary_artist_user?: { id: string; name: string } | null }> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select(`
        *,
        primary_artist_user:users!customers_primary_artist_id_fkey(id, name)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as DBCustomer & { primary_artist_user?: { id: string; name: string } | null };
  }

  /**
   * 전화번호로 고객 조회 (정규화 매칭)
   * phone_normalized 컬럼을 사용하여 포맷에 무관하게 매칭
   */
  async findByPhone(salonId: string, phone: string): Promise<DBCustomer | null> {
    if (!phone) return null;

    const normalized = phone.replace(/[^0-9+]/g, '');
    if (!normalized) return null;

    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("salon_id", salonId)
      .eq("phone_normalized", normalized)
      .maybeSingle();

    if (error) throw error;
    return data as DBCustomer | null;
  }

  /**
   * 이름 변경 이력 기록
   */
  async logNameChange(
    customerId: string,
    oldName: string,
    newName: string,
    changedBy: string
  ): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("customer_name_history")
      .insert({
        customer_id: customerId,
        old_name: oldName,
        new_name: newName,
        changed_by: changedBy,
      });

    if (error) {
      console.error("Failed to log name change:", error);
    }
  }

  /**
   * 고객 이름 변경 이력 조회
   */
  async getNameHistory(customerId: string): Promise<any[]> {
    const { data, error } = await (this.supabase as any)
      .from("customer_name_history")
      .select("*")
      .eq("customer_id", customerId)
      .order("changed_at", { ascending: false });

    if (error) throw error;
    return data || [];
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
   * 다음 고객번호 조회
   * - 사용되지 않은 가장 작은 번호 반환 (빈 번호 채우기)
   * - customer_number가 없는 고객도 고려하여 전체 고객 수 기준으로 계산
   */
  async getNextCustomerNumber(salonId: string): Promise<string> {
    // 전체 고객 수와 customer_number가 있는 고객 목록을 함께 조회
    const { data, error, count } = await (this.supabase as any)
      .from('customers')
      .select('customer_number', { count: 'exact' })
      .eq('salon_id', salonId);

    if (error) throw error;

    // 사용 중인 번호 Set 생성
    const usedNumbers = new Set<number>();
    if (data && data.length > 0) {
      for (const row of data) {
        if (row.customer_number) {
          const num = parseInt(row.customer_number, 10);
          if (!isNaN(num) && num > 0) {
            usedNumbers.add(num);
          }
        }
      }
    }

    // 전체 고객 수
    const totalCustomers = count || 0;

    // 고객이 없으면 1 반환
    if (totalCustomers === 0) {
      return '1';
    }

    // 1부터 순차적으로 빈 번호 찾기
    // 최소 totalCustomers + 1까지는 확인하여 모든 고객에게 번호가 있을 경우도 처리
    let nextNumber = 1;
    const maxCheck = Math.max(usedNumbers.size, totalCustomers) + 1;
    while (nextNumber <= maxCheck && usedNumbers.has(nextNumber)) {
      nextNumber++;
    }

    return nextNumber.toString();
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
        product_amount,
        status,
        customer_notes,
        staff_notes,
        payment_method,
        booking_meta,
        service:services(id, name, name_en, name_th),
        artist:users!bookings_artist_id_fkey(id, name)
      `)
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 여러 서비스 ID의 메뉴 상세 조회 (배치)
   * - booking_meta.service_ids 기반으로 시술 항목별 이름/카테고리/가격 조회
   */
  async getServicesByIds(serviceIds: string[]): Promise<any[]> {
    if (serviceIds.length === 0) return [];
    const { data, error } = await (this.supabase as any)
      .from('services')
      .select(`
        id,
        name,
        base_price,
        category:service_categories(id, name)
      `)
      .in('id', serviceIds);

    if (error) throw error;
    return data || [];
  }
}
