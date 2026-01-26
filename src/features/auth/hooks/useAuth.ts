import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAuthApi } from '../api';
import { supabase } from '@/lib/supabase/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { CheckStatus } from '../types';

const authApi = createAuthApi(supabase);

export const useRegistration = () => {
  const [emailStatus, setEmailStatus] = useState<CheckStatus>('idle');
  const [salonNameStatus, setSalonNameStatus] = useState<CheckStatus>('idle');
  const [emailMessage, setEmailMessage] = useState('');
  const [salonNameMessage, setSalonNameMessage] = useState('');

  const checkDuplicate = async (type: 'email' | 'salonName', value: string) => {
    if (!value) return;

    const setStatus = type === 'email' ? setEmailStatus : setSalonNameStatus;
    const setMessage = type === 'email' ? setEmailMessage : setSalonNameMessage;

    setStatus('checking');
    setMessage('');

    try {
      const data = await authApi.checkDuplicate({ type, value });

      if (data.available) {
        setStatus('available');
        setMessage(data.message || '사용 가능합니다.');
      } else {
        setStatus('taken');
        setMessage(data.message || '이미 사용 중입니다.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('중복 확인 중 오류가 발생했습니다.');
    }
  };

  return {
    emailStatus,
    salonNameStatus,
    emailMessage,
    salonNameMessage,
    setEmailStatus,
    setSalonNameStatus,
    setEmailMessage,
    setSalonNameMessage,
    checkDuplicate,
    registerOwner: authApi.registerOwner,
  };
};

export const useUser = () => {
  return useQuery({
    queryKey: endpoints.auth.me.queryKey(),
    queryFn: () => authApi.me(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
};

export const useLogin = (options?: any) => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authApi.login(credentials),
    ...options,
  });
};

export const useLogout = (options?: { onLogout?: () => void }) => {
  const queryClient = useQueryClient();

  const logout = () => {
    // 1. 로컬 상태 즉시 초기화 (즉각적인 사용자 반응)
    queryClient.clear();
    useAuthStore.getState().logout();

    // 2. 콜백 즉시 호출 (리다이렉트 등)
    options?.onLogout?.();

    // 3. 백그라운드에서 Supabase signOut (응답을 기다리지 않음)
    authApi.logout().catch((error) => {
      console.error('Background signOut error:', error);
    });
  };

  return { logout };
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: any) => authApi.register(data),
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (password: string) => authApi.resetPassword(password),
  });
};
