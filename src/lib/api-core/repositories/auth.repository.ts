import { BaseRepository } from "./base.repository";
import {
  RegisterOwnerDto,
  DuplicateCheckResult,
  RegisterOwnerResult,
} from "../types";

// Type for Edge Function error with context
interface EdgeFunctionError extends Error {
  context?: Response;
}

export class AuthRepository extends BaseRepository {
  async checkDuplicate(
    type: "email" | "shop_name" | "salonName" | "phone",
    value: string
  ): Promise<DuplicateCheckResult> {
    const { data, error } = await this.supabase.functions.invoke(
      "check-duplicate",
      {
        body: { type, value },
      }
    );

    if (error) throw error;
    return data as DuplicateCheckResult;
  }

  async registerOwner(params: RegisterOwnerDto): Promise<RegisterOwnerResult> {
    const { data, error } = await this.supabase.functions.invoke(
      "register-owner",
      {
        body: params,
      }
    );

    if (error) {
      // Try to extract readable message if context is available
      const edgeFnError = error as EdgeFunctionError;
      if (edgeFnError.context) {
        try {
          const text = await edgeFnError.context.text();
          console.log("Edge Function Error Body:", text);

          const json = JSON.parse(text) as { error?: string };
          if (json?.error) throw new Error(json.error);
        } catch (e) {
          console.warn("Failed to parse error context:", e);
        }
      }
      throw error;
    }
    return data as RegisterOwnerResult;
  }
}
