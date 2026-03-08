import { CustomerFilterRepository } from '../repositories/customer-filter.repository';
import { Client } from '../types';
import type {
  CustomFilter,
  CreateCustomFilterDto,
  UpdateCustomFilterDto,
} from '@/features/customers/types/filter.types';

export class CustomerFilterService {
  private repository: CustomerFilterRepository;

  constructor(private client: Client) {
    this.repository = new CustomerFilterRepository(this.client);
  }

  async getFilters(salonId: string): Promise<CustomFilter[]> {
    return this.repository.getFilters(salonId);
  }

  async createFilter(salonId: string, dto: CreateCustomFilterDto): Promise<CustomFilter> {
    return this.repository.createFilter(salonId, dto);
  }

  async updateFilter(id: string, updates: UpdateCustomFilterDto): Promise<CustomFilter> {
    return this.repository.updateFilter(id, updates);
  }

  async deleteFilter(id: string): Promise<void> {
    return this.repository.deleteFilter(id);
  }

  async reorderFilters(filters: { id: string; display_order: number }[]): Promise<void> {
    return this.repository.reorderFilters(filters);
  }
}
