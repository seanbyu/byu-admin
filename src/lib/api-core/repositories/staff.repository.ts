import { BaseRepository } from "./base.repository";

export class StaffRepository extends BaseRepository {
  async getStaffList(salonId: string) {
    if (!salonId) {
      throw new Error("Salon ID is required");
    }

    const { data: users, error } = await this.supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        phone,
        role,
        salon_id,
        profile_image,
        is_active,
        created_at,
        updated_at,
        staff_profiles (
          bio,
          years_of_experience,
          specialties,
          social_links,
          permissions,
          is_booking_enabled
        )
      `,
      )
      .eq("salon_id", salonId)
      .in("role", ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"])
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!users) {
      return [];
    }

    return users.map(this.transformToStaff);
  }

  async getStaffCount(salonId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .in("role", ["ADMIN", "MANAGER", "STAFF"]);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  async updateStaff(salonId: string, staffId: string, updates: any) {
    const profileUpdates: any = {};

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
      // Convert Array back to Object (if it comes as array)
      if (Array.isArray(updates.permissions)) {
        const permsObject: Record<string, any> = {};
        updates.permissions.forEach((p: any) => {
          permsObject[p.module] = {
            view: p.canRead,
            create: p.canWrite,
            edit: p.canWrite,
            delete: p.canDelete,
          };
        });
        profileUpdates.permissions = permsObject;
      } else {
        profileUpdates.permissions = updates.permissions;
      }
    }

    // Handle isBookingEnabled update
    if (typeof updates.isBookingEnabled !== "undefined") {
      profileUpdates.is_booking_enabled = updates.isBookingEnabled;
    }

    // Handle extended profile fields
    if (updates.description) profileUpdates.bio = updates.description;
    if (typeof updates.experience !== "undefined")
      profileUpdates.years_of_experience = updates.experience;
    if (updates.specialties) profileUpdates.specialties = updates.specialties;
    if (updates.socialLinks) profileUpdates.social_links = updates.socialLinks;

    // Handle other updates if needed (e.g. isActive, name, phone, profileImage)
    const userUpdates: any = {};
    if (typeof updates.isActive !== "undefined")
      userUpdates.is_active = updates.isActive;
    if (updates.name) userUpdates.name = updates.name;
    if (updates.phone) userUpdates.phone = updates.phone;
    if (typeof updates.profileImage !== "undefined")
      userUpdates.profile_image = updates.profileImage;

    if (Object.keys(userUpdates).length > 0) {
      // Users table update needed
      const { error: userError } = await (this.supabase.from("users") as any)
        .update(userUpdates)
        .eq("id", staffId);

      if (userError) throw userError;
    }

    // Update staff_profiles if permissions or other profile fields
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await (
        this.supabase.from("staff_profiles") as any
      ).upsert(
        { user_id: staffId, ...profileUpdates },
        { onConflict: "user_id" },
      );

      if (profileError) throw profileError;
    }

    return { success: true };
  }

  private transformToStaff(user: any) {
    const profile = user.staff_profiles?.[0] || user.staff_profiles || {};

    return {
      id: user.id,
      userId: user.id,
      salonId: user.salon_id,
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
      permissions: Object.entries(profile.permissions || {}).map(
        ([key, val]: [string, any]) => ({
          module: key,
          canRead: val.view || false,
          canWrite: val.edit || val.create || false,
          canDelete: val.delete || false,
        }),
      ),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };
  }
}
