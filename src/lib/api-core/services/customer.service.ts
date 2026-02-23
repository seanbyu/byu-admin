import { CustomerRepository } from "../repositories/customer.repository";
import {
  Client,
  DBCustomer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types";

// Input type for createCustomer (without salon_id)
interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

interface GetCustomersQueryParams {
  filter?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface CustomerListItem extends DBCustomer {
  total_spent: number;
  tags: string[];
  primary_artist?: {
    id: string;
    name: string;
  };
  latest_booking?: {
    booking_date: string;
    artist_name: string;
  };
}

export class CustomerService {
  private repository: CustomerRepository;

  constructor(private client: Client) {
    this.repository = new CustomerRepository(this.client);
  }

  async getCustomers(salonId: string): Promise<DBCustomer[]> {
    return this.repository.getCustomers(salonId);
  }

  async getCustomer(id: string): Promise<DBCustomer> {
    return this.repository.getCustomer(id);
  }

  /**
   * 고객 목록 조회 (필터링, 정렬, 통계 포함)
   * - async-parallel: bookings 데이터를 함께 조회
   * - js-cache-function-results: 필터 로직 재사용
   */
  async getCustomersWithFilters(
    salonId: string,
    queryParams: GetCustomersQueryParams
  ): Promise<{ data: CustomerListItem[]; total: number; page: number; limit: number }> {
    const limit = queryParams.limit || 50;
    const offset = queryParams.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    // Repository에서 데이터 조회
    const { customers, total } = await this.repository.getCustomersWithStats({
      salonId,
      ...queryParams,
    });

    // 통계 계산 및 태그 추가
    // rerender-memo: 복잡한 계산을 별도 함수로 분리
    const enrichedCustomers = customers.map((customer: any) => {
      const bookings = customer.bookings || [];
      const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');

      // 총 매출 계산
      const totalSpent = completedBookings.reduce(
        (sum: number, b: any) => sum + (b.total_price || 0),
        0
      );

      // 최근 예약 정보
      const latestBooking = bookings.length > 0 ? bookings[0] : null;

      // 태그 생성
      const tags = this.generateCustomerTags(customer, completedBookings);

      // Primary artist - 저장된 담당자 정보 사용 (primary_artist_id 기반)
      // primary_artist_user는 repository에서 join으로 가져온 데이터
      const assignedPrimaryArtist = customer.primary_artist_user;

      // bookings 필드와 primary_artist_user 필드 제거하고 반환
      const { bookings: _, primary_artist_user: __, ...customerWithoutBookings } = customer;

      return {
        ...customerWithoutBookings,
        total_spent: totalSpent,
        tags,
        primary_artist: assignedPrimaryArtist
          ? { id: assignedPrimaryArtist.id, name: assignedPrimaryArtist.name }
          : undefined,
        latest_booking: latestBooking
          ? {
              booking_date: latestBooking.booking_date,
              artist_name: latestBooking.artist?.name || '',
            }
          : undefined,
      };
    });

    // 필터 적용 (클라이언트 측)
    let filteredCustomers = enrichedCustomers;
    if (queryParams.filter && queryParams.filter !== 'all') {
      filteredCustomers = this.applyFilter(enrichedCustomers, queryParams.filter);
    }

    return {
      data: filteredCustomers,
      total: filteredCustomers.length,
      page,
      limit,
    };
  }

  /**
   * 고객 태그 생성
   * - js-early-exit: 조건에 따라 조기 반환
   */
  private generateCustomerTags(customer: any, completedBookings: any[]): string[] {
    const tags: string[] = [];

    // 신규 고객
    if (customer.total_visits === 0) {
      tags.push('NEW');
    }

    // 재방문 고객
    if (customer.total_visits > 0 && customer.total_visits < 5) {
      tags.push('RETURNING');
    }

    // 단골 고객
    if (customer.total_visits >= 5) {
      tags.push('REGULAR');
    }

    // 휴면 고객 (30일 이상 미방문)
    if (customer.last_visit) {
      const daysSinceLastVisit =
        (Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastVisit > 30) {
        tags.push('DORMANT');
      }
    }

    // VIP (총 매출 기준 - 임의로 100,000원 이상)
    const totalSpent = completedBookings.reduce(
      (sum, b) => sum + (b.total_price || 0),
      0
    );
    if (totalSpent >= 100000) {
      tags.push('VIP');
    }

    return tags;
  }

  /**
   * 필터 적용
   * - js-set-map-lookups: Set을 사용하여 O(1) 조회
   */
  private applyFilter(customers: CustomerListItem[], filter: string): CustomerListItem[] {
    switch (filter) {
      case 'new':
        return customers.filter((c) => c.tags.includes('NEW'));
      case 'returning':
        return customers.filter((c) => c.tags.includes('RETURNING'));
      case 'regular':
        return customers.filter((c) => c.tags.includes('REGULAR'));
      case 'dormant':
        return customers.filter((c) => c.tags.includes('DORMANT'));
      case 'vip':
        return customers.filter((c) => c.tags.includes('VIP'));
      case 'all':
      default:
        return customers;
    }
  }

  async createCustomer(
    salonId: string,
    customer: CreateCustomerInput
  ): Promise<DBCustomer> {
    const dto: CreateCustomerDto = { ...customer, salon_id: salonId };
    return this.repository.createCustomer(dto);
  }

  // 전화번호로 기존 고객 찾거나 새로 생성
  async findOrCreateCustomer(
    salonId: string,
    customer: CreateCustomerInput
  ): Promise<DBCustomer> {
    // 전화번호가 있으면 기존 고객 검색
    if (customer.phone) {
      const existing = await this.repository.findByPhone(salonId, customer.phone);
      if (existing) {
        // 이름이 다르면 이력 기록 후 업데이트
        if (existing.name !== customer.name) {
          await this.repository.logNameChange(existing.id, existing.name, customer.name, 'admin');
          return this.repository.updateCustomer(existing.id, { name: customer.name });
        }
        return existing;
      }
    }

    // 새 고객 생성
    const dto: CreateCustomerDto = { ...customer, salon_id: salonId };
    return this.repository.createCustomer(dto);
  }

  async updateCustomer(id: string, updates: UpdateCustomerDto): Promise<DBCustomer> {
    return this.repository.updateCustomer(id, updates);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.repository.deleteCustomer(id);
  }

  /**
   * 다음 고객번호 조회
   * - 현재 최대 고객번호 + 1 반환
   */
  async getNextCustomerNumber(salonId: string): Promise<string> {
    return this.repository.getNextCustomerNumber(salonId);
  }

  /**
   * 고객 차트 조회 (상세 정보 + 시술 이력 + 통계)
   * - async-parallel: 고객 정보와 예약 정보를 병렬 조회
   */
  async getCustomerChart(salonId: string, customerId: string) {
    // 고객 정보, 예약 정보, 이름 변경 이력을 병렬 조회
    const [customer, bookingsData, nameHistory] = await Promise.all([
      this.repository.getCustomer(customerId),
      this.repository.getCustomerBookings(customerId),
      this.repository.getNameHistory(customerId),
    ]);

    const bookings = bookingsData || [];
    const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');

    // 통계 계산
    const totalSpent = completedBookings.reduce(
      (sum: number, b: any) => sum + (b.total_price || 0),
      0
    );

    // 방문 간격 계산
    const visitDates = completedBookings
      .map((b: any) => new Date(b.booking_date).getTime())
      .sort((a: number, b: number) => a - b);

    let avgVisitInterval = 0;
    if (visitDates.length > 1) {
      const intervals = [];
      for (let i = 1; i < visitDates.length; i++) {
        intervals.push((visitDates[i] - visitDates[i - 1]) / (1000 * 60 * 60 * 24));
      }
      avgVisitInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    }

    // 서비스 카운트
    const serviceCounts = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    completedBookings.forEach((b: any) => {
      if (b.service?.name) {
        const current = serviceCounts.get(b.service.name) || {
          id: b.service.id || '',
          name: b.service.name,
          count: 0,
        };
        serviceCounts.set(b.service.name, { ...current, count: current.count + 1 });
      }
    });

    const favoriteServiceData = Array.from(serviceCounts.values()).sort(
      (a, b) => b.count - a.count
    )[0];

    // 아티스트 카운트
    const artistCounts = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    completedBookings.forEach((b: any) => {
      if (b.artist?.name) {
        const current = artistCounts.get(b.artist.name) || {
          id: b.artist.id || '',
          name: b.artist.name,
          count: 0,
        };
        artistCounts.set(b.artist.name, { ...current, count: current.count + 1 });
      }
    });

    const favoriteArtistData = Array.from(artistCounts.values()).sort(
      (a, b) => b.count - a.count
    )[0];

    // 태그 생성
    const tags = this.generateCustomerTags(customer, completedBookings);

    // 시술 이력 (최근 순)
    const serviceHistory = completedBookings
      .sort(
        (a: any, b: any) =>
          new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
      )
      .map((b: any) => ({
        id: b.id,
        booking_date: b.booking_date,
        start_time: b.start_time,
        service: {
          id: b.service?.id || '',
          name: b.service?.name || '',
          name_en: b.service?.name_en,
          name_th: b.service?.name_th,
        },
        artist: {
          id: b.artist?.id || '',
          name: b.artist?.name || '',
        },
        customer_notes: b.customer_notes,
        staff_notes: b.staff_notes,
        total_price: b.total_price || 0,
        status: b.status,
      }));

    // Primary artist - 저장된 담당자 정보 사용 (primary_artist_id 기반)
    const assignedPrimaryArtist = (customer as any).primary_artist_user;

    // primary_artist_user 필드 제거
    const { primary_artist_user: _, ...customerData } = customer as any;

    return {
      customer: {
        ...customerData,
        total_spent: totalSpent,
        tags,
        primary_artist: assignedPrimaryArtist
          ? { id: assignedPrimaryArtist.id, name: assignedPrimaryArtist.name }
          : undefined,
        favorite_service: favoriteServiceData
          ? { id: favoriteServiceData.id, name: favoriteServiceData.name }
          : undefined,
      },
      stats: {
        total_visits: customer.total_visits,
        total_spent: totalSpent,
        avg_visit_interval: avgVisitInterval,
        avg_spending_per_visit:
          completedBookings.length > 0 ? totalSpent / completedBookings.length : 0,
        favorite_service: favoriteServiceData
          ? { name: favoriteServiceData.name, count: favoriteServiceData.count }
          : undefined,
        favorite_artist: favoriteArtistData
          ? { name: favoriteArtistData.name, count: favoriteArtistData.count }
          : undefined,
        first_visit_date: visitDates.length > 0 ? new Date(visitDates[0]) : null,
        last_visit_date:
          visitDates.length > 0 ? new Date(visitDates[visitDates.length - 1]) : null,
      },
      service_history: serviceHistory,
      name_history: nameHistory,
    };
  }
}
