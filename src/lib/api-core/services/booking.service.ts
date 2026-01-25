import { BookingRepository } from "../repositories/booking.repository";
import {
  Client,
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponse,
  DBBooking,
} from "../types";

export class BookingService {
  private repository: BookingRepository;

  constructor(private client: Client) {
    this.repository = new BookingRepository(this.client);
  }

  async getBookings(salonId: string): Promise<BookingResponse[]> {
    return this.repository.getBookings(salonId);
  }

  async createBooking(
    _salonId: string,
    booking: CreateBookingDto
  ): Promise<DBBooking> {
    return this.repository.createBooking(booking);
  }

  async updateBooking(id: string, updates: UpdateBookingDto): Promise<DBBooking> {
    return this.repository.updateBooking(id, updates);
  }

  async cancelBooking(id: string): Promise<DBBooking> {
    return this.repository.cancelBooking(id);
  }

  async completeBooking(id: string): Promise<DBBooking> {
    return this.repository.completeBooking(id);
  }
}
