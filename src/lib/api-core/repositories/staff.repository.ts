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
  display_order?: number;
  bio?: string;
  years_of_experience?: number;
  specialties?: string[];
  social_links?: Partial<DBSocialLinks>;
  work_schedule?: DBWorkSchedule;
  holidays?: unknown[];
  position_id?: string | null;
}

interface StaffPositionRow {
  id: string;
  name: string | null;
  name_en: string | null;
  name_th: string | null;
}

interface StaffUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profile_image: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffProfileWithUser extends DBStaffProfile {
  salon_id: string | null;
  is_owner: boolean;
  is_approved: boolean;
  display_order: number | null;
  created_at: string;
  staff_positions: StaffPositionRow | null;
  users: StaffUserRow | null;
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
        display_order,
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
          deleted_at,
          created_at,
          updated_at
        )
      `,
      )
      .eq("salon_id", salonId)
      .eq("is_approved", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!profiles) {
      return [];
    }

    // Filter by role from joined users table
    // Include both active staff and resigned staff (within 7 days grace period)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const typedProfiles = profiles as StaffProfileWithUser[];

    const filteredProfiles = typedProfiles.filter((profile) => {
      const user = profile.users;
      if (!user) return false;
      if (!["SUPER_ADMIN", "ADMIN", "MANAGER", "ARTIST", "STAFF"].includes(user.role)) return false;

      // Active staff
      if (user.is_active) return true;

      // Resigned staff within 7 days grace period
      if (!user.is_active && user.deleted_at) {
        const deletedDate = new Date(user.deleted_at);
        return deletedDate >= sevenDaysAgo;
      }

      return false;
    });

    return filteredProfiles.map((profile) => this.transformProfileToStaff(profile));
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

  private static readonly DEFAULT_STAFF_PERMISSIONS = {
    dashboard: { canRead: true, canWrite: true, canDelete: false },
    bookings: { canRead: true, canWrite: true, canDelete: false },
    customers: { canRead: true, canWrite: true, canDelete: false },
    staff: { canRead: true, canWrite: true, canDelete: false },
    menus: { canRead: true, canWrite: true, canDelete: false },
    reviews: { canRead: true, canWrite: true, canDelete: false },
    sales: { canRead: true, canWrite: true, canDelete: false },
    settings: { canRead: true, canWrite: true, canDelete: false },
  };

  async getSalonPlanType(salonId: string): Promise<string> {
    const { data: salon, error } = await this.supabase
      .from("salons")
      .select("plan_type")
      .eq("id", salonId)
      .single();
    if (error) throw new Error("Failed to fetch salon info");
    return (salon as any)?.plan_type || "FREE";
  }

  async isOwner(staffId: string, salonId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("staff_profiles")
      .select("is_owner")
      .eq("user_id", staffId)
      .eq("salon_id", salonId)
      .maybeSingle();
    return !!(data as any)?.is_owner;
  }

  async createStaffUser(params: {
    salonId: string;
    email: string;
    name: string;
    role: string;
    password: string;
    createdById: string;
  }): Promise<{ success: boolean }> {
    const { salonId, email, name, role, password, createdById } = params;

    let finalEmail = email;
    if (!finalEmail.includes("@")) {
      finalEmail = `${email}@salon.local`;
    }

    const { data: newUser, error: createError } =
      await this.supabase.auth.admin.createUser({
        email: finalEmail,
        password,
        email_confirm: true,
        user_metadata: { name, role, user_type: "SALON", salon_id: salonId, is_approved: true },
      });

    if (createError) throw createError;
    if (!newUser.user) throw new Error("Failed to create user");

    const newUserId = newUser.user.id;

    const { data: existingUser } = await this.supabase
      .from("users")
      .select("id")
      .eq("id", newUserId)
      .maybeSingle();

    if (!existingUser) {
      const { error: userInsertError } = await (
        this.supabase.from("users") as ReturnType<typeof this.supabase.from>
      ).insert({
        id: newUserId,
        user_type: "SALON",
        role: role.toUpperCase(),
        email: finalEmail,
        name,
        is_active: true,
      } as never);

      if (userInsertError) {
        await this.supabase.auth.admin.deleteUser(newUserId);
        throw new Error(
          `ERROR_CREATE_USER_PROFILE: ${userInsertError.message} (${userInsertError.code})`
        );
      }
    } else {
      await (this.supabase.from("users") as ReturnType<typeof this.supabase.from>)
        .update({ role: role.toUpperCase(), name } as never)
        .eq("id", newUserId);
    }

    const { data: existingProfile } = await this.supabase
      .from("staff_profiles")
      .select("user_id")
      .eq("user_id", newUserId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileInsertError } = await (
        this.supabase.from("staff_profiles") as ReturnType<typeof this.supabase.from>
      ).insert({
        user_id: newUserId,
        salon_id: salonId,
        is_owner: false,
        is_approved: true,
        approved_by: createdById,
        approved_at: new Date().toISOString(),
        created_by: createdById,
        is_booking_enabled: true,
        permissions: StaffRepository.DEFAULT_STAFF_PERMISSIONS,
      } as never);

      if (profileInsertError) {
        await (this.supabase.from("users") as ReturnType<typeof this.supabase.from>)
          .delete()
          .eq("id", newUserId);
        await this.supabase.auth.admin.deleteUser(newUserId);
        throw new Error(`ERROR_CREATE_STAFF_PROFILE: ${profileInsertError.message}`);
      }
    } else {
      await (this.supabase.from("staff_profiles") as ReturnType<typeof this.supabase.from>)
        .update({
          salon_id: salonId,
          is_approved: true,
          approved_by: createdById,
          approved_at: new Date().toISOString(),
          is_booking_enabled: true,
          permissions: StaffRepository.DEFAULT_STAFF_PERMISSIONS,
        } as never)
        .eq("user_id", newUserId);
    }

    return { success: true };
  }

  async softDeleteStaff(staffId: string): Promise<{ success: boolean }> {
    const { error } = await (
      this.supabase.from("users") as ReturnType<typeof this.supabase.from>
    )
      .update({ is_active: false, deleted_at: new Date().toISOString() } as never)
      .eq("id", staffId);
    if (error) throw new Error("Failed to process resignation");
    return { success: true };
  }

  async cancelResignation(staffId: string): Promise<{ success: boolean }> {
    const { error } = await (
      this.supabase.from("users") as ReturnType<typeof this.supabase.from>
    )
      .update({ is_active: true, deleted_at: null } as never)
      .eq("id", staffId);
    if (error) throw new Error("Failed to cancel resignation");
    return { success: true };
  }

  async hardDeleteStaff(staffId: string): Promise<{ success: boolean }> {
    const { error: profileError } = await this.supabase
      .from("staff_profiles")
      .delete()
      .eq("user_id", staffId);
    if (profileError) throw new Error("Failed to delete staff profile");

    const { error: userError } = await (
      this.supabase.from("users") as ReturnType<typeof this.supabase.from>
    )
      .delete()
      .eq("id", staffId);
    if (userError) throw new Error("Failed to delete user");

    const { error: authError } = await this.supabase.auth.admin.deleteUser(staffId);
    if (authError) throw new Error("Failed to delete auth user");

    return { success: true };
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

    // Handle displayOrder update
    if (typeof updates.displayOrder !== "undefined") {
      profileUpdates.display_order = updates.displayOrder;
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
  private transformProfileToStaff(profile: StaffProfileWithUser): StaffResponse {
    const user = profile.users;
    const position = profile.staff_positions;

    if (!user) {
      throw new Error("Invalid staff profile: missing user relation");
    }

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
      displayOrder: profile.display_order ?? 0,
      permissions: this.transformPermissionsFromDB(profile.permissions),
      workHours: StaffRepository.transformWorkHoursFromDB(profile.work_schedule),
      holidays: profile.holidays || [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      deletedAt: user.deleted_at || null,
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
    const position = Array.isArray(profile.staff_positions)
      ? profile.staff_positions[0]
      : profile.staff_positions;

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
      displayOrder: profile.display_order ?? 0,
      permissions: this.transformPermissionsFromDB(profile.permissions),
      workHours: StaffRepository.transformWorkHoursFromDB(profile.work_schedule),
      holidays: profile.holidays || [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      deletedAt: user.deleted_at || null,
      phone: user.phone,
      email: user.email,
      role: user.role as string,
      positionId: profile.position_id || null,
      positionTitle: position?.name || null,
      positionTitle_en: position?.name_en || null,
      positionTitle_th: position?.name_th || null,
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

  /**
   * Bulk update staff display order
   * @param staffOrders Array of { staffId, displayOrder }
   */
  async updateStaffDisplayOrder(
    staffOrders: { staffId: string; displayOrder: number }[]
  ): Promise<{ success: boolean }> {
    // Update each staff's display_order
    const updates = staffOrders.map(({ staffId, displayOrder }) =>
      this.supabase
        .from("staff_profiles")
        .update({ display_order: displayOrder } as never)
        .eq("user_id", staffId)
    );

    const results = await Promise.all(updates);

    const hasError = results.some((result) => result.error);
    if (hasError) {
      const errors = results
        .filter((r) => r.error)
        .map((r) => r.error?.message);
      throw new Error(`Failed to update display order: ${errors.join(", ")}`);
    }

    return { success: true };
  }
}
