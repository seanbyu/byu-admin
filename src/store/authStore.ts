import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User, Staff } from '@/types';

// 로그인 상태 유지 여부에 따른 스토리지 선택
const REMEMBER_ME_KEY = 'auth-remember-me';

// 커스텀 스토리지: rememberMe 설정에 따라 localStorage/sessionStorage 선택
const createDynamicStorage = (): StateStorage => ({
  getItem: (name: string): string | null => {
    // 먼저 localStorage에서 확인 (rememberMe=true인 경우)
    const localValue = localStorage.getItem(name);
    if (localValue) return localValue;

    // 없으면 sessionStorage에서 확인 (rememberMe=false인 경우)
    return sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    if (rememberMe) {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
});

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  login: (user: User, token: string, rememberMe?: boolean) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setRememberMe: (value: boolean) => void;
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
      rememberMe: true, // 기본값: 로그인 상태 유지
      staffCache: null,

      login: (user, token, rememberMe) => {
        set((state) => {
          const resolvedRememberMe = rememberMe ?? state.rememberMe;

          // rememberMe 설정 저장 (스토리지 선택에 사용)
          localStorage.setItem(REMEMBER_ME_KEY, String(resolvedRememberMe));

          return {
            user,
            token,
            isAuthenticated: true,
            rememberMe: resolvedRememberMe,
          };
        });
      },

      setToken: (token) => {
        set((state) => ({
          token,
          isAuthenticated: Boolean(token && state.user),
        }));
      },

      logout: () => {
        // 상태 초기화
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

        // 모든 스토리지에서 인증 정보 삭제
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
        localStorage.removeItem(REMEMBER_ME_KEY);
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setRememberMe: (value) => {
        localStorage.setItem(REMEMBER_ME_KEY, String(value));
        set({ rememberMe: value });
      },

      // set staff cache
      setStaffCache: (staff) => set({ staffCache: staff }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createDynamicStorage()),
    }
  )
);
