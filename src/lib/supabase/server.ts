import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { Database } from '@/lib/supabase/types';

/**
 * Service Role 클라이언트 — RLS 우회, Route Handler 전용
 * 클라이언트 컴포넌트에서 절대 사용 금지
 */
export const createServiceClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export const createClient = (req?: NextRequest) => {
  const authHeader = req?.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  const options: { global?: { headers: { Authorization: string } } } = {};

  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
};
