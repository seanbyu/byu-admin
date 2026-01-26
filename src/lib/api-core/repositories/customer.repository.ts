import { BaseRepository } from "./base.repository";
import {
  DBCustomer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types";

// Note: customers table schema in generated types is outdated, so we use 'any' cast
export class CustomerRepository extends BaseRepository {
  async getCustomers(salonId: string): Promise<DBCustomer[]> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("salon_id", salonId);

    if (error) throw error;
    return (data || []) as DBCustomer[];
  }

  async getCustomer(id: string): Promise<DBCustomer> {
    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as DBCustomer;
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
}
