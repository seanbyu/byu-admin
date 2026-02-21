import { BaseRepository } from "./base.repository";
import {
  DBBooking,
  DBBookingWithRelations,
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponse,
} from "../types";

// Note: bookings table may not be in generated types yet, so we use 'any' cast
export class BookingRepository extends BaseRepository {
  async getBookings(salonId: string): Promise<BookingResponse[]> {
    const { data, error } = await (this.supabase as any)
      .from("bookings")
      .select(`
        *,
        customer:customers!bookings_customer_id_fkey(id, name, phone),
        artist:users!bookings_artist_id_fkey(id, name),
        service:services(id, name, base_price),
        product:salon_products(id, name, price)
      `)
      .eq("salon_id", salonId)
      .order("booking_date", { ascending: false });

    if (error) throw error;

    // Transform to frontend format
    return (data || []).map((booking: any) =>
      this.transformBooking(booking)
    );
  }

  async createBooking(booking: CreateBookingDto): Promise<DBBooking> {
    const { data, error } = await (this.supabase as any)
      .from("bookings")
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data as DBBooking;
  }

  async updateBooking(id: string, updates: UpdateBookingDto): Promise<DBBooking> {
    const { data, error } = await (this.supabase as any)
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as DBBooking;
  }

  async cancelBooking(id: string): Promise<DBBooking> {
    return this.updateBooking(id, {
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
    });
  }

  async completeBooking(id: string): Promise<DBBooking> {
    return this.updateBooking(id, { status: "COMPLETED" });
  }

  async confirmBooking(id: string): Promise<DBBooking> {
    return this.updateBooking(id, { status: "CONFIRMED" });
  }

  async deleteBooking(id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  private transformBooking(booking: any): BookingResponse {
    return {
      id: booking.id,
      customerId: booking.customer_id,
      customerName: booking.customer?.name || "고객",
      customerPhone: booking.customer?.phone || "",
      salonId: booking.salon_id,
      staffId: booking.artist_id,
      staffName: booking.artist?.name || "",
      serviceId: booking.service_id,
      serviceName: booking.service?.name || "",
      date: booking.booking_date,
      startTime: booking.start_time?.slice(0, 5) || "",
      endTime: booking.end_time?.slice(0, 5) || "",
      status: booking.status,
      price: Number(booking.total_price) || 0,
      source: "ONLINE",
      notes: booking.customer_notes ?? null,
      paymentMethod: booking.payment_method ?? null,
      // 아래 필드들은 migration 24_booking_products.sql 적용 후 실제 데이터 반영
      productId: booking.product_id ?? null,
      productName: booking.product?.name ?? null,
      productAmount: Number(booking.product_amount) || 0,
      storeSalesAmount: Number(booking.store_sales_amount) || 0,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    };
  }
}
