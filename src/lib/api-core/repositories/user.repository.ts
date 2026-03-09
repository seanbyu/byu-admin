import { BaseRepository } from "./base.repository";
import { DBUser } from "../types";

// Update profile DTO
interface UpdateProfileDto {
  name?: string;
  phone?: string;
}

export class UserRepository extends BaseRepository {
  async getProfile(userId: string): Promise<DBUser> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as unknown as DBUser;
  }

  async updateProfile(
    userId: string,
    updates: UpdateProfileDto
  ): Promise<DBUser> {
    // Type assertion needed due to Supabase generated types mismatch
    const { data, error } = await this.supabase
      .from("users")
      .update(updates as never)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as DBUser;
  }
}
