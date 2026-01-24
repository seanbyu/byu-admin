import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository {
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(
    userId: string,
    updates: { name?: string; phone?: string }
  ) {
    // Explicitly casting to avoid 'never' inference issue with Supabase types
    const { data, error } = await (this.supabase.from("users") as any)
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
