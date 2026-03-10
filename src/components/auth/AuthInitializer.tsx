'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

export function AuthInitializer() {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Check current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          // 2. Fetch fresh user data from DB
          const user = await getCurrentUser();
          if (!mounted) return;
          if (user) {
            // Update store with fresh data
            // We use login here to fully reset state with fresh user/token
            login(user, session.access_token);
          } else {
            // Session exists but user data fetch failed (e.g. deleted user)
            logout();
          }
        }
      } catch (err) {
        // Supabase internally uses navigator.locks.request() for session refresh.
        // During page navigation, the lock's AbortController signal can be aborted,
        // causing a benign AbortError. We safely ignore it here.
        if (err instanceof Error && err.name === 'AbortError') return;
        throw err;
      }
    };

    // Run on mount
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // TOKEN_REFRESHED: Supabase SDK가 토큰을 자체 관리 — Zustand 업데이트 불필요

      if (event === 'SIGNED_IN' && session) {
        const user = await getCurrentUser();
        if (user) login(user);
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, logout]);

  return null; // This component doesn't render anything
}
