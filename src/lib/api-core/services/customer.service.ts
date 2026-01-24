import { SupabaseClient } from "@supabase/supabase-js";
import { CustomerRepository } from "../repositories/customer.repository";

export class CustomerService {
  private repository: CustomerRepository;

  constructor(private client: SupabaseClient<any>) {
    this.repository = new CustomerRepository(this.client);
  }

  async getCustomers(salonId: string) {
    return this.repository.getCustomers(salonId);
  }

  async getCustomer(id: string) {
    return this.repository.getCustomer(id);
  }

  async createCustomer(salonId: string, customer: any) {
    return this.repository.createCustomer({ ...customer, salon_id: salonId });
  }

  async updateCustomer(id: string, updates: any) {
    return this.repository.updateCustomer(id, updates);
  }

  async deleteCustomer(id: string) {
    return this.repository.deleteCustomer(id);
  }
}
