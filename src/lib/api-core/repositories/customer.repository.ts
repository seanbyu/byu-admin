import { BaseRepository } from "./base.repository";

export class CustomerRepository extends BaseRepository {
  async getCustomers(salonId: string) {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("salon_id", salonId);

    if (error) throw error;
    return data;
  }

  async getCustomer(id: string) {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async createCustomer(customer: any) {
    const { data, error } = await this.supabase
      .from("customers")
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCustomer(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from("customers")
      // @ts-ignore
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCustomer(id: string) {
    const { error } = await this.supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
}
