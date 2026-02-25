import { BookingRepository } from "../repositories/booking.repository";
import {
  Client,
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponse,
  DBBooking,
} from "../types";

// Frontend에서 받는 예약 데이터 타입 (camelCase)
interface CreateBookingInput {
  salonId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  staffId: string;
  serviceId: string;
  serviceName?: string;
  serviceIds?: string[];
  date: Date | string;
  startTime: string;
  endTime: string;
  status?: string;
  price: number;
  source?: string;
  notes?: string;
}

export class BookingService {
  private repository: BookingRepository;

  constructor(private client: Client) {
    this.repository = new BookingRepository(this.client);
  }

  async getBookings(salonId: string): Promise<BookingResponse[]> {
    return this.repository.getBookings(salonId);
  }

  async createBooking(
    salonId: string,
    input: CreateBookingInput | CreateBookingDto
  ): Promise<DBBooking> {
    // camelCase를 snake_case로 변환
    const booking: CreateBookingDto = this.transformToDbFormat(salonId, input);
    return this.repository.createBooking(booking);
  }

  // Frontend camelCase → DB snake_case 변환
  private transformToDbFormat(
    salonId: string,
    input: CreateBookingInput | CreateBookingDto
  ): CreateBookingDto {
    // 이미 snake_case인 경우 (CreateBookingDto)
    if ('salon_id' in input) {
      return input as CreateBookingDto;
    }

    // camelCase → snake_case 변환
    const camelInput = input as CreateBookingInput;
    const bookingDate = this.toLocalDateString(camelInput.date);

    return {
      salon_id: salonId,
      customer_id: camelInput.customerId,
      artist_id: camelInput.staffId,
      service_id: camelInput.serviceId,
      booking_date: bookingDate,
      start_time: camelInput.startTime,
      end_time: camelInput.endTime,
      duration_minutes: this.calculateDuration(camelInput.startTime, camelInput.endTime),
      service_price: camelInput.price,
      total_price: camelInput.price,
      customer_notes: camelInput.notes,
      ...((camelInput.serviceName || camelInput.serviceIds) && {
        booking_meta: {
          ...(camelInput.serviceName && { category_name: camelInput.serviceName }),
          ...(camelInput.serviceIds && { service_ids: camelInput.serviceIds }),
        },
      }),
    };
  }

  // 시작/종료 시간으로 duration 계산
  private calculateDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  async updateBooking(id: string, updates: UpdateBookingDto | Record<string, any>): Promise<DBBooking> {
    // camelCase → snake_case 변환
    const transformedUpdates = this.transformUpdatesToDbFormat(updates);
    return this.repository.updateBooking(id, transformedUpdates);
  }

  // Updates camelCase → DB snake_case 변환
  private transformUpdatesToDbFormat(updates: Record<string, any>): UpdateBookingDto {
    const keyMap: Record<string, string> = {
      staffId: 'artist_id',
      serviceId: 'service_id',
      date: 'booking_date',
      startTime: 'start_time',
      endTime: 'end_time',
      price: 'total_price',
      notes: 'customer_notes',
      paymentMethod: 'payment_method',
      productId: 'product_id',
      productName: 'product_name',
      productAmount: 'product_amount',
      storeSalesAmount: 'store_sales_amount',
    };

    // 프론트엔드 전용 필드 (DB 컬럼 없음) — 무시
    const skipKeys = new Set([
      'staffName', 'customerName', 'customerPhone', 'source', 'salonId',
    ]);

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (skipKeys.has(key)) continue;
      // serviceName → booking_meta.category_name 으로 변환
      if (key === 'serviceName') {
        if (value) {
          result['booking_meta'] = { ...(result['booking_meta'] || {}), category_name: value };
        }
        continue;
      }
      // serviceIds → booking_meta.service_ids 으로 변환
      if (key === 'serviceIds') {
        if (Array.isArray(value)) {
          result['booking_meta'] = { ...(result['booking_meta'] || {}), service_ids: value };
        }
        continue;
      }
      const newKey = keyMap[key] || key;
      // date를 문자열로 변환
      if (key === 'date') {
        result[newKey] = this.toLocalDateString(value);
      } else {
        result[newKey] = value;
      }
    }
    return result as UpdateBookingDto;
  }

  // Date 객체를 UTC가 아닌 로컬 기준 yyyy-MM-dd로 직렬화
  private toLocalDateString(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).split('T')[0];
  }

  async cancelBooking(id: string): Promise<DBBooking> {
    return this.repository.cancelBooking(id);
  }

  async completeBooking(id: string): Promise<DBBooking> {
    return this.repository.completeBooking(id);
  }

  async confirmBooking(id: string): Promise<DBBooking> {
    return this.repository.confirmBooking(id);
  }

  async deleteBooking(id: string): Promise<void> {
    return this.repository.deleteBooking(id);
  }
}
