'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';
import { StoreInfo, AccountInfo, Plan, Subscription } from '../types';

// Query Keys
export const settingsKeys = {
  all: ['settings'] as const,
  storeInfo: (salonId: string) => [...settingsKeys.all, 'store', salonId] as const,
  plans: () => [...settingsKeys.all, 'plans'] as const,
  subscription: (salonId: string) => [...settingsKeys.all, 'subscription', salonId] as const,
  account: (userId: string) => [...settingsKeys.all, 'account', userId] as const,
};

// Store Info Hook
export function useStoreInfo(salonId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.storeInfo(salonId),
    queryFn: () => settingsApi.getStoreInfo(salonId),
    enabled: options?.enabled !== false && !!salonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<StoreInfo>) => settingsApi.updateStoreInfo(salonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.storeInfo(salonId) });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadStoreImage(salonId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.storeInfo(salonId) });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => settingsApi.deleteStoreImage(salonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.storeInfo(salonId) });
    },
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

// Mock Plans Data
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

// Mock Subscription Data
const MOCK_SUBSCRIPTION: Subscription = {
  planId: 'basic',
  planName: 'Basic',
  price: 29000,
  nextBillingDate: '2026-03-01',
  status: 'active',
};

// Plans Hook (Mock Data)
export function usePlans() {
  // Return mock data instead of API call
  return {
    plans: MOCK_PLANS,
    isLoading: false,
    error: null,
  };
}

// Subscription Hook (Mock Data)
export function useSubscription(salonId: string, options?: { enabled?: boolean }) {
  // Return mock data instead of API call
  return {
    subscription: MOCK_SUBSCRIPTION,
    isLoading: false,
    error: null,
    upgradePlan: async (planId: string) => {
      console.log('Upgrade plan:', planId);
      // TODO: Implement real API call
    },
    isUpgrading: false,
    refetch: () => Promise.resolve(),
  };
}

// Account Hook
export function useAccount(userId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.account(userId),
    queryFn: () => settingsApi.getAccountInfo(userId),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AccountInfo>) => settingsApi.updateAccountInfo(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.account(userId) });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      settingsApi.changePassword(userId, data),
  });

  const accountInfo = useMemo(() => query.data?.data || null, [query.data]);

  return {
    accountInfo,
    isLoading: query.isLoading,
    error: query.error,
    updateAccount: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    refetch: query.refetch,
  };
}

// Phone Verification Hook
export function usePhoneVerification() {
  const sendCodeMutation = useMutation({
    mutationFn: (phone: string) => settingsApi.sendVerificationCode(phone),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      settingsApi.verifyCode(phone, code),
  });

  return {
    sendCode: sendCodeMutation.mutateAsync,
    isSendingCode: sendCodeMutation.isPending,
    verifyCode: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
  };
}

// Password Change Hook
export function usePasswordChange() {
  const changePasswordMutation = useMutation({
    mutationFn: ({ userId, currentPassword, newPassword }: {
      userId: string;
      currentPassword: string;
      newPassword: string
    }) => settingsApi.changePassword(userId, { currentPassword, newPassword }),
  });

  return {
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}
