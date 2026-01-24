import { SupabaseClient } from "@supabase/supabase-js";
import { StaffRepository } from "../repositories/staff.repository";

export class StaffService {
  private repository: StaffRepository;

  constructor(private client: SupabaseClient<any>) {
    this.repository = new StaffRepository(this.client);
  }

  async getStaffList(salonId: string) {
    return this.repository.getStaffList(salonId);
  }

  async updateStaff(salonId: string, staffId: string, updates: any) {
    return this.repository.updateStaff(salonId, staffId, updates);
  }
}
