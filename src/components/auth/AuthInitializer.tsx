'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

export function AuthInitializer() {
  const { login, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // 2. Fetch fresh user data from DB
        const user = await getCurrentUser();
        if (user) {
          // Update store with fresh data
          // We use login here to fully reset state with fresh user/token
          login(user, session.access_token);
        } else {
          // Session exists but user data fetch failed (e.g. deleted user)
          logout();
        }
      }
    };

    // Run on mount
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = await getCurrentUser();
        if (user) login(user, session.access_token);
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout]);

  return null; // This component doesn't render anything
}
