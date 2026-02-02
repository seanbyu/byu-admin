import { BaseRepository } from "./base.repository";
import { BusinessHours, StaffPermission } from "@/types";
import {
  DBUserWithProfile,
  DBStaffProfile,
  DBWorkSchedule,
  DBDaySchedule,
  DBPermissions,
  DBSocialLinks,
  UpdateStaffDto,
  StaffResponse,
  DayName,
  DAY_NAMES,
  DAY_MAP,
} from "../types";

// Internal type for user table updates
interface UserTableUpdates {
  is_active?: boolean;
  name?: string;
  phone?: string;
  profile_image?: string;
}

// Internal type for staff_profiles table updates
interface ProfileTableUpdates {
  user_id?: string;
  permissions?: DBPermissions;
  is_booking_enabled?: boolean;
  bio?: string;
  years_of_experience?: number;
  specialties?: string[];
  social_links?: Partial<DBSocialLinks>;
  work_schedule?: DBWorkSchedule;
  holidays?: unknown[];
  position_id?: string | null;
}

export class StaffRepository extends BaseRepository {
  async getStaffList(salonId: string): Promise<StaffResponse[]> {
    if (!salonId) {
      throw new Error("Salon ID is required");
    }

    // Query from staff_profiles and join users via user_id FK
    const { data: profiles, error } = await this.supabase
      .from("staff_profiles")
      .select(
        `
        user_id,
        salon_id,
        is_owner,
        is_approved,
        bio,
        years_of_experience,
        specialties,
        social_links,
        permissions,
        is_booking_enabled,
        work_schedule,
        holidays,
        position_id,
        created_at,
        staff_positions (
          id,
          name,
          name_en,
          name_th
        ),
        users!staff_profiles_user_id_fkey (
          id,
          name,
          email,
          phone,
          role,
          profile_image,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .eq("salon_id", salonId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!profiles) {
      return [];
    }

    // Filter by role and is_active from joined users table
    const filteredProfiles = profiles.filter((p: any) => {
      const user = p.users;
      return user &&
        user.is_active &&
        ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(user.role);
    });

    return filteredProfiles.map((profile: any) => this.transformProfileToStaff(profile));
  }

  async getStaffCount(salonId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("staff_profiles")
      .select("*, users!staff_profiles_user_id_fkey(role)", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("is_approved", true);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async updateStaff(
    _salonId: string,
    staffId: string,
    updates: UpdateStaffDto
  ): Promise<{ success: boolean }> {
    const profileUpdates: ProfileTableUpdates = {};

    // Handle password update
    if (updates.password) {
      const { error: authError } =
        await this.supabase.auth.admin.updateUserById(staffId, {
          password: updates.password,
        });
      if (authError) throw authError;
    }

    // Handle permissions update
    if (updates.permissions) {
      if (Array.isArray(updates.permissions)) {
        // Convert Array format to Object format
        const permsObject: DBPermissions = {};
        updates.permissions.forEach((p: StaffPermission) => {
          permsObject[p.module] = {
            view: p.canRead,
            create: p.canWrite,
            edit: p.canWrite,
            delete: p.canDelete,
          };
        });
        profileUpdates.permissions = permsObject;
      } else {
        profileUpdates.permissions = updates.permissions as DBPermissions;
      }
    }

    // Handle isBookingEnabled update
    if (typeof updates.isBookingEnabled !== "undefined") {
      profileUpdates.is_booking_enabled = updates.isBookingEnabled;
    }

    // Handle extended profile fields
    if (updates.description) profileUpdates.bio = updates.description;
    if (typeof updates.experience !== "undefined") {
      profileUpdates.years_of_experience = updates.experience;
    }
    if (updates.specialties) profileUpdates.specialties = updates.specialties;
    if (updates.socialLinks) profileUpdates.social_links = updates.socialLinks;

    // Handle workHours update (convert to DB format)
    if (updates.workHours) {
      profileUpdates.work_schedule = this.transformWorkHoursToDB(updates.workHours);
    }

    // Handle holidays update
    if (updates.holidays !== undefined) {
      profileUpdates.holidays = updates.holidays;
    }

    // Handle positionId update
    if (updates.positionId !== undefined) {
      profileUpdates.position_id = updates.positionId || null;
    }

    // Handle user table updates
    const userUpdates: UserTableUpdates = {};
    if (typeof updates.isActive !== "undefined") {
      userUpdates.is_active = updates.isActive;
    }
    if (updates.name) userUpdates.name = updates.name;
    if (updates.phone) userUpdates.phone = updates.phone;
    if (typeof updates.profileImage !== "undefined") {
      userUpdates.profile_image = updates.profileImage;
    }

    if (Object.keys(userUpdates).length > 0) {
      // Type assertion needed due to Supabase generated types mismatch
      const { error: userError } = await (this.supabase
        .from("users") as ReturnType<typeof this.supabase.from>)
        .update(userUpdates as never)
        .eq("id", staffId);

      if (userError) throw userError;
    }

    // Update staff_profiles if profile fields exist
    if (Object.keys(profileUpdates).length > 0) {
      // Use update instead of upsert to avoid salon_id NOT NULL constraint issue
      const { error: profileError } = await (this.supabase
        .from("staff_profiles") as ReturnType<typeof this.supabase.from>)
        .update(profileUpdates as never)
        .eq("user_id", staffId);

      if (profileError) throw profileError;
    }

    return { success: true };
  }

  // Transform from staff_profiles query result (profile with nested user)
  private transformProfileToStaff(profile: any): StaffResponse {
    const user = profile.users;
    const position = profile.staff_positions;

    return {
      id: user.id,
      userId: user.id,
      salonId: profile.salon_id || "",
      name: user.name,
      description: profile.bio || "",
      experience: profile.years_of_experience || 0,
      profileImage: user.profile_image,
      portfolioImages: [],
      specialties: profile.specialties || [],
      socialLinks: profile.social_links || {},
      rating: 0,
      reviewCount: 0,
      isActive: user.is_active,
      isBookingEnabled: profile.is_booking_enabled ?? true,
      permissions: this.transformPermissionsFromDB(profile.permissions),
      workHours: StaffRepository.transformWorkHoursFromDB(profile.work_schedule),
      holidays: profile.holidays || [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      phone: user.phone,
      email: user.email,
      role: user.role as string,
      positionId: profile.position_id || null,
      positionTitle: position?.name || null,
      positionTitle_en: position?.name_en || null,
      positionTitle_th: position?.name_th || null,
    };
  }

  // Transform from users query result (user with nested profile) - legacy method
  private transformToStaff(user: DBUserWithProfile): StaffResponse {
    const profileData = user.staff_profiles;
    const profile: Partial<DBStaffProfile> = Array.isArray(profileData)
      ? profileData[0] || {}
      : profileData || {};

    return {
      id: user.id,
      userId: user.id,
      salonId: user.salon_id || "",
      name: user.name,
      description: profile.bio || "",
      experience: profile.years_of_experience || 0,
      profileImage: user.profile_image,
      portfolioImages: [],
      specialties: profile.specialties || [],
      socialLinks: profile.social_links || {},
      rating: 0,
      reviewCount: 0,
      isActive: user.is_active,
      isBookingEnabled: profile.is_booking_enabled ?? true,
      permissions: this.transformPermissionsFromDB(profile.permissions),
      workHours: StaffRepository.transformWorkHoursFromDB(profile.work_schedule),
      holidays: profile.holidays || [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      phone: user.phone,
      email: user.email,
      role: user.role as string,
      positionId: (profile as any).position_id || null,
      positionTitle: (profile as any).staff_positions?.name || null,
      positionTitle_en: (profile as any).staff_positions?.name_en || null,
      positionTitle_th: (profile as any).staff_positions?.name_th || null,
    };
  }

  private transformPermissionsFromDB(
    dbPermissions: DBPermissions | null | undefined
  ): StaffPermission[] {
    if (!dbPermissions) return [];

    return Object.entries(dbPermissions).map(([key, val]) => ({
      module: key,
      canRead: val.view || false,
      canWrite: val.edit || val.create || false,
      canDelete: val.delete || false,
    }));
  }

  // Transform frontend workHours format to DB work_schedule format
  private transformWorkHoursToDB(workHours: BusinessHours[]): DBWorkSchedule {
    const result: DBWorkSchedule = {};

    workHours.forEach((hour) => {
      const dayName = DAY_NAMES[hour.dayOfWeek];
      if (dayName) {
        result[dayName] = {
          enabled: hour.isOpen,
          start: hour.isOpen ? hour.openTime : null,
          end: hour.isOpen ? hour.closeTime : null,
        };
      }
    });

    return result;
  }

  // Transform DB work_schedule format to frontend workHours format
  private static transformWorkHoursFromDB(
    dbSchedule: DBWorkSchedule | null | undefined
  ): BusinessHours[] {
    if (!dbSchedule) return StaffRepository.getDefaultWorkHours();

    return Object.entries(dbSchedule)
      .map(([day, value]: [string, DBDaySchedule]) => ({
        dayOfWeek: DAY_MAP[day as DayName] ?? 0,
        openTime: value.start || "10:00",
        closeTime: value.end || "20:00",
        isOpen: value.enabled ?? false,
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  private static getDefaultWorkHours(): BusinessHours[] {
    return Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: "10:00",
      closeTime: "20:00",
      isOpen: i !== 0,
    }));
  }
}
