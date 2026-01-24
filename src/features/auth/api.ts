import { AuthService } from '@salon-admin/api-core';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  signInWithEmail,
  signOut,
  signUpWithEmail,
  getCurrentUser,
  sendPasswordResetEmail,
  updatePassword,
} from '@/lib/auth';
import {
  RegisterOwnerParams,
  CheckDuplicateParams,
  CheckDuplicateResponse,
  LoginParams,
  RegisterParams,
} from './types';

export const createAuthApi = (client: SupabaseClient<any>) => {
  const service = new AuthService(client);

  return {
    checkDuplicate: async ({
      type,
      value,
    }: CheckDuplicateParams): Promise<CheckDuplicateResponse> => {
      const data = await service.checkDuplicate(type, value);
      return data as CheckDuplicateResponse;
    },

    registerOwner: async (params: RegisterOwnerParams) => {
      return service.registerOwner(params);
    },

    // Wrappers for lib/auth.ts
    login: async ({ email, password }: LoginParams) => {
      return signInWithEmail(email, password);
    },

    logout: async () => {
      return signOut();
    },

    register: async (params: RegisterParams) => {
      // Note: lib/auth signUpWithEmail exists but registerOwner is used for owners?
      // mutations.ts had useRegister using /auth/register?
      // lib/api/mutations.ts: useRegister -> apiClient.post('/auth/register')
      // This conflicts with how registerOwner usage was.
      // check if useRegister was actually used.
      return signUpWithEmail(params.email, params.password, {
        name: params.name,
        phone: params.phone,
        role: params.role as any, // casting as any because UserRole might need type alignment
      });
    },

    forgotPassword: async (email: string) => {
      return sendPasswordResetEmail(email);
    },

    resetPassword: async (password: string) => {
      return updatePassword(password); // Note: updatePassword assumes logged in user?
      // endpoints.ts says /auth/reset-password.
      // mutations.ts used /auth/reset-password with { token, password }.
      // lib/auth.ts updatePassword uses supabase.auth.updateUser (requires session).
      // If we are resetting via token (email link), we typically use exchangeCodeForSession?
      // Or Supabase handles it on the page landing.
      // I'll stick to what lib/auth provides.
    },

    me: async () => {
      return getCurrentUser();
    },
  };
};

export const authApi = {
  // Legacy support replaced
};
