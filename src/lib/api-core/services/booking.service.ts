import { SupabaseClient } from "@supabase/supabase-js";
import { BookingRepository } from "../repositories/booking.repository";

export class BookingService {
  private repository: BookingRepository;

  constructor(private client: SupabaseClient<any>) {
    this.repository = new BookingRepository(this.client);
  }

  async getBookings(salonId: string) {
    return this.repository.getBookings(salonId);
  }

  async createBooking(salonId: string, booking: any) {
    return this.repository.createBooking(booking);
  }

  async updateBooking(id: string, updates: any) {
    return this.repository.updateBooking(id, updates);
  }

  async cancelBooking(id: string) {
    return this.repository.cancelBooking(id);
  }

  async completeBooking(id: string) {
    return this.repository.completeBooking(id);
  }
}
