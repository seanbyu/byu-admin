import { StaffRepository } from "../repositories/staff.repository";
import { Client, UpdateStaffDto, StaffResponse } from "../types";

export class StaffService {
  private repository: StaffRepository;

  constructor(private client: Client) {
    this.repository = new StaffRepository(this.client);
  }

  async getStaffList(salonId: string): Promise<StaffResponse[]> {
    return this.repository.getStaffList(salonId);
  }

  async updateStaff(
    salonId: string,
    staffId: string,
    updates: UpdateStaffDto
  ): Promise<{ success: boolean }> {
    return this.repository.updateStaff(salonId, staffId, updates);
  }
}
