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

  // 전화번호로 기존 고객 찾거나 새로 생성
  async findOrCreateCustomer(
    salonId: string,
    customer: CreateCustomerInput
  ): Promise<DBCustomer> {
    // 전화번호가 있으면 기존 고객 검색
    if (customer.phone) {
      const existing = await this.repository.findByPhone(salonId, customer.phone);
      if (existing) {
        // 이름이 다르면 업데이트
        if (existing.name !== customer.name) {
          return this.repository.updateCustomer(existing.id, { name: customer.name });
        }
        return existing;
      }
    }

    // 새 고객 생성
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
