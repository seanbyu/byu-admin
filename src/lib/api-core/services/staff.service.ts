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

  async updateStaffRole(staffId: string, role: string): Promise<{ success: boolean }> {
    return this.repository.updateStaffRole(staffId, role);
  }

  async updateStaffDisplayOrder(
    staffOrders: { staffId: string; displayOrder: number }[]
  ): Promise<{ success: boolean }> {
    return this.repository.updateStaffDisplayOrder(staffOrders);
  }

  async createStaff(
    salonId: string,
    params: { email: string; name: string; role: string; password?: string },
    createdById: string
  ): Promise<{ success: boolean }> {
    const planType = await this.repository.getSalonPlanType(salonId);
    if (planType === "FREE") {
      const count = await this.repository.getStaffCount(salonId);
      if (count >= 5) {
        throw new Error("LIMIT_REACHED: Free plan allows up to 5 staff members.");
      }
    }
    return this.repository.createStaffUser({
      salonId,
      email: params.email,
      name: params.name,
      role: params.role,
      password: params.password || "salon1234!",
      createdById,
    });
  }

  async softDeleteStaff(
    staffId: string,
    salonId: string,
    requesterId: string
  ): Promise<{ success: boolean }> {
    if (requesterId === staffId) throw new Error("ERROR_CANNOT_DELETE_SELF");
    const owner = await this.repository.isOwner(staffId, salonId);
    if (owner) throw new Error("ERROR_CANNOT_DELETE_OWNER");
    return this.repository.softDeleteStaff(staffId);
  }

  async cancelResignation(staffId: string): Promise<{ success: boolean }> {
    return this.repository.cancelResignation(staffId);
  }

  async hardDeleteStaff(
    staffId: string,
    salonId: string,
    requesterId: string
  ): Promise<{ success: boolean }> {
    if (requesterId === staffId) throw new Error("ERROR_CANNOT_DELETE_SELF");
    const owner = await this.repository.isOwner(staffId, salonId);
    if (owner) throw new Error("ERROR_CANNOT_DELETE_OWNER");
    return this.repository.hardDeleteStaff(staffId);
  }
}
