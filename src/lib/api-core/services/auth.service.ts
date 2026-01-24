import { SupabaseClient } from "@supabase/supabase-js";
import { AuthRepository } from "../repositories/auth.repository";

export class AuthService {
  private repository: AuthRepository;

  constructor(private client: SupabaseClient<any>) {
    this.repository = new AuthRepository(this.client);
  }

  async checkDuplicate(
    type: "email" | "shop_name" | "salonName" | "phone",
    value: string,
  ) {
    return this.repository.checkDuplicate(type, value);
  }

  async registerOwner(params: any) {
    return this.repository.registerOwner(params);
  }

  async sendOtp(phone: string) {
    return this.client.auth.signInWithOtp({
      phone,
    });
  }

  async verifyOtp(phone: string, token: string) {
    return this.client.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
  }
}
