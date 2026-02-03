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
    const bookingDate = camelInput.date instanceof Date
      ? camelInput.date.toISOString().split('T')[0]
      : String(camelInput.date).split('T')[0];

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
    };

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      const newKey = keyMap[key] || key;
      // date를 문자열로 변환
      if (key === 'date' && value instanceof Date) {
        result[newKey] = value.toISOString().split('T')[0];
      } else {
        result[newKey] = value;
      }
    }
    return result as UpdateBookingDto;
  }

  async cancelBooking(id: string): Promise<DBBooking> {
    return this.repository.cancelBooking(id);
  }

  async completeBooking(id: string): Promise<DBBooking> {
    return this.repository.completeBooking(id);
  }
}
