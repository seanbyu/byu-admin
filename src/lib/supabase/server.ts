import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Service Role 클라이언트 — RLS 우회, Route Handler 전용
 * 클라이언트 컴포넌트에서 절대 사용 금지
 */
export const createServiceClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export const createClient = (req?: NextRequest) => {
  const authHeader = req?.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  const options: any = {};

  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
};
