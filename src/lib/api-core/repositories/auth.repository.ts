import { BaseRepository } from "./base.repository";

export class AuthRepository extends BaseRepository {
  async checkDuplicate(
    type: "email" | "shop_name" | "salonName" | "phone",
    value: string,
  ) {
    const { data, error } = await this.supabase.functions.invoke(
      "check-duplicate",
      {
        body: { type, value },
      },
    );

    if (error) throw error;
    return data;
  }

  async registerOwner(params: any) {
    // Note: Edge Functions usually accessed via functions.invoke
    // But if original code used direct fetch, we can wrap it or use invoke
    // Assuming invoke is preferred for consistency within Supabase library
    const { data, error } = await this.supabase.functions.invoke(
      "register-owner",
      {
        body: params,
      },
    );

    if (error) {
      // Try to extract readable message if context is available
      if (error instanceof Error && "context" in error) {
        const context = (error as any).context;
        try {
          // Clone response if possible to avoid body used error, or just read text
          // Note: context is a Response object
          const text = await context.text();
          console.log("Edge Function Error Body:", text);

          const json = JSON.parse(text);
          if (json && json.error) throw new Error(json.error);
        } catch (e) {
          console.warn("Failed to parse error context:", e);
        }
      }
      throw error;
    }
    return data;
  }
}
