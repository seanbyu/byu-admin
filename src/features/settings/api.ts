import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { StoreInfo, Plan, Subscription, AccountInfo } from './types';

export const settingsApi = {
  // Store Info
  getStoreInfo: async (salonId: string): Promise<ApiResponse<StoreInfo>> => {
    return apiClient.get(`/salons/${salonId}`);
  },

  updateStoreInfo: async (salonId: string, data: Partial<StoreInfo>): Promise<ApiResponse<StoreInfo>> => {
    return apiClient.patch(`/salons/${salonId}`, data);
  },

  uploadStoreImage: async (salonId: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.upload(`/salons/${salonId}/image`, formData);
  },

  deleteStoreImage: async (salonId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/salons/${salonId}/image`);
  },

  // Plans & Subscription
  getPlans: async (): Promise<ApiResponse<Plan[]>> => {
    return apiClient.get('/plans');
  },

  getSubscription: async (salonId: string): Promise<ApiResponse<Subscription>> => {
    return apiClient.get(`/salons/${salonId}/subscription`);
  },

  upgradePlan: async (salonId: string, planId: string): Promise<ApiResponse> => {
    return apiClient.post(`/salons/${salonId}/subscription/upgrade`, { planId });
  },

  // Account
  getAccountInfo: async (userId: string): Promise<ApiResponse<AccountInfo>> => {
    return apiClient.get(`/users/${userId}`);
  },

  updateAccountInfo: async (userId: string, data: Partial<AccountInfo>): Promise<ApiResponse<AccountInfo>> => {
    return apiClient.patch(`/users/${userId}`, data);
  },

  changePassword: async (userId: string, data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> => {
    return apiClient.post(`/users/${userId}/change-password`, data);
  },

  sendVerificationCode: async (phone: string): Promise<ApiResponse> => {
    return apiClient.post('/auth/send-verification', { phone });
  },

  verifyCode: async (phone: string, code: string): Promise<ApiResponse> => {
    return apiClient.post('/auth/verify-code', { phone, code });
  },
};
