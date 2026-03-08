import { CustomerGroupRepository } from '../repositories/customer-group.repository';
import { Client } from '../types';
import type { CustomerGroup } from '@/features/customers/types';

export class CustomerGroupService {
  private repository: CustomerGroupRepository;

  constructor(private client: Client) {
    this.repository = new CustomerGroupRepository(this.client);
  }

  async getCustomerGroups(salonId: string): Promise<CustomerGroup[]> {
    return this.repository.getCustomerGroups(salonId);
  }
}
