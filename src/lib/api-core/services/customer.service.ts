import { CustomerRepository } from "../repositories/customer.repository";
import {
  Client,
  DBCustomer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "../types";

// Input type for createCustomer (without salon_id)
interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export class CustomerService {
  private repository: CustomerRepository;

  constructor(private client: Client) {
    this.repository = new CustomerRepository(this.client);
  }

  async getCustomers(salonId: string): Promise<DBCustomer[]> {
    return this.repository.getCustomers(salonId);
  }

  async getCustomer(id: string): Promise<DBCustomer> {
    return this.repository.getCustomer(id);
  }

  async createCustomer(
    salonId: string,
    customer: CreateCustomerInput
  ): Promise<DBCustomer> {
    const dto: CreateCustomerDto = { ...customer, salon_id: salonId };
    return this.repository.createCustomer(dto);
  }

  async updateCustomer(id: string, updates: UpdateCustomerDto): Promise<DBCustomer> {
    return this.repository.updateCustomer(id, updates);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.repository.deleteCustomer(id);
  }
}
