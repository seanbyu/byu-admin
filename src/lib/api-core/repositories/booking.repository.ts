import { BaseRepository } from "./base.repository";
import {
  DBBooking,
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponse,
} from "../types";

interface BookingFilters {
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  salesOnly?: boolean; // sales_registered = true 전용 컬럼 사용
}

// 프론트 결제수단 → payments 테이블 enum 매핑
const PAYMENT_METHOD_MAP: Record<string, string> = {
  CARD: "CREDIT_CARD",
  CASH: "CASH",
  TRANSFER: "BANK_TRANSFER",
};

// Note: bookings table may not be in generated types yet, so we use 'any' cast
export class BookingRepository extends BaseRepository {
  async getBookings(salonId: string, filters?: BookingFilters): Promise<BookingResponse[]> {
    let query = (this.supabase as any)
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

    if (filters?.startDate) {
      query = query.gte("booking_date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("booking_date", filters.endDate);
    }
    // 전용 컬럼 사용 — JSONB 필터 대비 인덱스 활용으로 성능 개선
    if (filters?.salesOnly) {
      query = query.eq("sales_registered", true);
    }

    const { data, error } = await query;
    if (error) throw error;

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
      .select(`
        *,
        customer:customers!bookings_customer_id_fkey(id, name, phone)
      `)
      .single();

    if (error) throw error;
    return data as DBBooking;
  }

  /**
   * 매출 등록 — bookings 업데이트 + payments 테이블에 기록
   * 기존 FULL_PAYMENT 레코드가 있으면 삭제 후 재생성 (수정 시 금액 변경 반영)
   */
  async upsertPaymentRecord(
    salonId: string,
    bookingId: string,
    booking: DBBooking,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const totalAmount =
      (Number(booking.total_price) || 0) + (Number(booking.product_amount) || 0);

    const paymentMethod =
      PAYMENT_METHOD_MAP[booking.payment_method ?? ""] ?? "OTHER";

    // 기존 FULL_PAYMENT 삭제 (수정 등록 시 중복 방지)
    await (this.supabase as any)
      .from("payments")
      .delete()
      .eq("booking_id", bookingId)
      .eq("payment_type", "FULL_PAYMENT");

    // 금액이 0이면 payments 기록 생략
    if (totalAmount <= 0) return;

    const { error } = await (this.supabase as any)
      .from("payments")
      .insert({
        salon_id: salonId,
        booking_id: bookingId,
        customer_id: booking.customer_id,
        payment_type: "FULL_PAYMENT",
        amount: totalAmount,
        currency: "THB",
        payment_method: paymentMethod,
        status: "COMPLETED",
        processed_at: new Date().toISOString(),
        metadata: {
          service_amount: Number(booking.total_price) || 0,
          product_amount: Number(booking.product_amount) || 0,
          ...metadata,
        },
      });

    if (error) throw error;
  }

  /**
   * 매출 삭제 — 해당 예약의 FULL_PAYMENT를 CANCELLED 처리 (감사 이력 보존)
   */
  async cancelPaymentRecord(bookingId: string): Promise<void> {
    await (this.supabase as any)
      .from("payments")
      .update({ status: "CANCELLED" })
      .eq("booking_id", bookingId)
      .eq("payment_type", "FULL_PAYMENT");
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
    return this.updateBooking(id, {
      status: "CONFIRMED",
      confirmed_at: new Date().toISOString(),
    });
  }

  async deleteBooking(id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async getBookingSnapshot(
    id: string,
    salonId: string
  ): Promise<{ booking_date: string; artist_id: string } | null> {
    const { data, error } = await (this.supabase as any)
      .from("bookings")
      .select("booking_date, artist_id")
      .eq("id", id)
      .eq("salon_id", salonId)
      .single();

    if (error) return null;
    return data;
  }

  async getBookingMeta(id: string): Promise<Record<string, unknown>> {
    const { data } = await (this.supabase as any)
      .from("bookings")
      .select("booking_meta")
      .eq("id", id)
      .single();

    return (data?.booking_meta as Record<string, unknown> | null) ?? {};
  }

  async updateBookingMeta(id: string, meta: Record<string, unknown>): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("bookings")
      .update({ booking_meta: meta })
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
      serviceName: booking.booking_meta?.category_name || booking.service?.name || "",
      date: booking.booking_date,
      startTime: booking.start_time?.slice(0, 5) || "",
      endTime: booking.end_time?.slice(0, 5) || "",
      status: booking.status,
      price: Number(booking.total_price) || 0,
      source: "ONLINE",
      notes: booking.customer_notes ?? null,
      paymentMethod: booking.payment_method ?? null,
      productId: booking.product_id ?? null,
      productName: booking.product_name ?? booking.product?.name ?? null,
      productAmount: Number(booking.product_amount) || 0,
      storeSalesAmount: Number(booking.store_sales_amount) || 0,
      salesRegistered: booking.sales_registered ?? false,
      bookingMeta: booking.booking_meta ?? undefined,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    };
  }
}
