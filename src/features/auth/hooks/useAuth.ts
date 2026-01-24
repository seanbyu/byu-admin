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

export const useLogout = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    ...options,
    onSuccess: (...args) => {
      // Clear all queries on logout
      queryClient.clear();
      // Update store
      useAuthStore.getState().logout();
      if (options?.onSuccess) {
        options.onSuccess(...args);
      }
    },
  });
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
