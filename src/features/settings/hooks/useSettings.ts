'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';
import { StoreInfo, Plan, Subscription } from '../types';

// ============================================
// Query Keys - 일관된 키 관리
// ============================================

export const settingsKeys = {
  all: ['settings'] as const,
  storeInfo: (salonId: string) => [...settingsKeys.all, 'store', salonId] as const,
  storeInfoDirect: (salonId: string) => ['salon-store-info', salonId] as const,
  plans: () => [...settingsKeys.all, 'plans'] as const,
  subscription: (salonId: string) => [...settingsKeys.all, 'subscription', salonId] as const,
  account: (userId: string) => [...settingsKeys.all, 'account', userId] as const,
};

// ============================================
// Store Info Hook
// ============================================

export function useStoreInfo(salonId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.storeInfo(salonId),
    queryFn: () => settingsApi.getStoreInfo(salonId),
    enabled: options?.enabled !== false && !!salonId,
    staleTime: 5 * 60 * 1000,
  });

  // 모든 관련 쿼리 무효화 함수
  const invalidateAllStoreQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: settingsKeys.storeInfo(salonId) });
    queryClient.invalidateQueries({ queryKey: settingsKeys.storeInfoDirect(salonId) });
    queryClient.invalidateQueries({ queryKey: ['salon', salonId] });
  }, [queryClient, salonId]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<StoreInfo>) => settingsApi.updateStoreInfo(salonId, data),
    onSuccess: invalidateAllStoreQueries,
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadStoreImage(salonId, file),
    onSuccess: invalidateAllStoreQueries,
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => settingsApi.deleteStoreImage(salonId),
    onSuccess: invalidateAllStoreQueries,
  });

  const storeInfo = useMemo(() => query.data?.data || null, [query.data]);

  return {
    storeInfo,
    isLoading: query.isLoading,
    error: query.error,
    updateStoreInfo: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    uploadImage: uploadImageMutation.mutateAsync,
    isUploadingImage: uploadImageMutation.isPending,
    deleteImage: deleteImageMutation.mutateAsync,
    isDeletingImage: deleteImageMutation.isPending,
    refetch: query.refetch,
  };
}

// ============================================
// Plans - Mock Data (변경 없음)
// ============================================

const MOCK_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29000,
    maxStaff: 5,
    maxMenus: 50,
    features: ['기본 예약 관리', '고객 관리'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59000,
    maxStaff: 20,
    maxMenus: null,
    features: ['무제한 메뉴', '매출 분석', '우선 지원'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    maxStaff: -1,
    maxMenus: null,
    features: ['무제한 직원', '전용 지원', '맞춤 기능'],
  },
];

const MOCK_SUBSCRIPTION: Subscription = {
  planId: 'basic',
  planName: 'Basic',
  price: 29000,
  nextBillingDate: '2026-03-01',
  status: 'active',
};

export function usePlans() {
  return {
    plans: MOCK_PLANS,
    isLoading: false,
    error: null,
  };
}

export function useSubscription(_salonId: string, _options?: { enabled?: boolean }) {
  const upgradePlan = useCallback(async (_planId: string) => {
    // TODO: Implement real API call
  }, []);

  return {
    subscription: MOCK_SUBSCRIPTION,
    isLoading: false,
    error: null,
    upgradePlan,
    isUpgrading: false,
    refetch: () => Promise.resolve(),
  };
}

// ============================================
// Account Info Hook (Update Only)
// 조회는 authStore에서 하고, 업데이트만 API 호출
// ============================================

import { AccountInfo } from '../types';

export function useAccountInfo(userId: string) {
  const updateMutation = useMutation({
    mutationFn: (data: Partial<AccountInfo>) => settingsApi.updateAccountInfo(userId, data),
  });

  return {
    updateAccountInfo: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

// ============================================
// Phone Verification Hook (Supabase - Phone Change)
// 이미 로그인된 사용자의 전화번호 변경용
// ============================================

import { supabase } from '@/lib/supabase/client';

// E.164 포맷으로 변환 (예: +82-01012345678 → 821012345678)
// Supabase 테스트 번호 형식과 맞추기 위해 + 기호 제거
const toE164 = (phone: string): string => {
  // 하이픈 및 + 기호 제거
  let formatted = phone.replace(/[-+]/g, '');

  // 국가코드 뒤의 0 제거 (예: 820 → 82, 660 → 66)
  // 82010... → 8210..., 66095... → 6695...
  formatted = formatted.replace(/^(\d{1,3})0/, '$1');

  return formatted;
};

export function usePhoneVerification() {
  // 전화번호 변경 요청 (인증 코드 발송)
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const e164Phone = toE164(phone);
      // updateUser를 사용하면 새 전화번호로 인증 코드가 발송됨
      const { error } = await supabase.auth.updateUser({ phone: e164Phone });
      if (error) {
        throw error;
      }
      return { success: true, e164Phone };
    },
  });

  // 인증 코드 확인
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ phone, token }: { phone: string; token: string }) => {
      const e164Phone = toE164(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token,
        type: 'sms', // 테스트 번호 호환을 위해 sms 타입 사용
      });
      if (error) {
        throw error;
      }
      return { success: true, user: data.user };
    },
  });

  return {
    sendCode: sendOtpMutation.mutateAsync,
    isSendingCode: sendOtpMutation.isPending,
    sendError: sendOtpMutation.error,
    verifyCode: verifyOtpMutation.mutateAsync,
    isVerifying: verifyOtpMutation.isPending,
    verifyError: verifyOtpMutation.error,
    resetSendCode: sendOtpMutation.reset,
    resetVerify: verifyOtpMutation.reset,
  };
}

// ============================================
// Password Change Hook
// ============================================

export function usePasswordChange() {
  const changePasswordMutation = useMutation({
    mutationFn: ({
      userId,
      currentPassword,
      newPassword,
    }: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    }) => settingsApi.changePassword(userId, { currentPassword, newPassword }),
  });

  return {
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}
