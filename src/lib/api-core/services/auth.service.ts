import { AuthApiError } from "@supabase/supabase-js";
import { AuthRepository } from "../repositories/auth.repository";
import {
  Client,
  RegisterOwnerDto,
  DuplicateCheckResult,
  RegisterOwnerResult,
} from "../types";

export class AuthService {
  private repository: AuthRepository;

  constructor(private client: Client) {
    this.repository = new AuthRepository(this.client);
  }

  async checkDuplicate(
    type: "email" | "shop_name" | "salonName" | "phone",
    value: string
  ): Promise<DuplicateCheckResult> {
    return this.repository.checkDuplicate(type, value);
  }

  async registerOwner(params: RegisterOwnerDto): Promise<RegisterOwnerResult> {
    return this.repository.registerOwner(params);
  }

  async sendOtp(phone: string): Promise<{
    data: { user: null; session: null };
    error: AuthApiError | null;
  }> {
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
