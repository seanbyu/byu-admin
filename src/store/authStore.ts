import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Staff } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  // ★ staff cache ★
  staffCache: Staff[] | null;
  setStaffCache: (staff: Staff[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      staffCache: null,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // 상태 초기화
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

        // localStorage에서 인증 정보 완전 삭제
        localStorage.removeItem('auth-storage');

        // 다른 관련 localStorage 항목도 삭제 (필요시)
        // localStorage.clear(); // 모든 localStorage를 삭제하려면 이것 사용
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
      // set staff cache
      setStaffCache: (staff) => set({ staffCache: staff }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
