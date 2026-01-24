import { BaseRepository } from "./base.repository";

export class BookingRepository extends BaseRepository {
  async getBookings(salonId: string) {
    const { data, error } = await this.supabase
      .from("appointments")
      .select("*")
      .eq("salon_id", salonId); // Assuming column name is snake_case in Supabase

    if (error) throw error;
    return data;
  }

  async createBooking(booking: any) {
    const { data, error } = await this.supabase
      .from("appointments")
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateBooking(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from("appointments")
      // @ts-ignore
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async cancelBooking(id: string) {
    return this.updateBooking(id, { status: "cancelled" });
  }

  async completeBooking(id: string) {
    return this.updateBooking(id, { status: "completed" }); // or 'finished', checking enum if possible. Assuming 'completed' based on endpoint name.
  }
}
