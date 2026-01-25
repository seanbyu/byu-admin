import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse, BusinessHours, Holiday } from '@/types';

export const salonsApi = {
  getSalons: async (params?: any) => {
    return apiClient.get(endpoints.salons.all.path(), params);
  },

  getSalon: async (id: string) => {
    return apiClient.get(endpoints.salons.detail.path(id));
  },

  createSalon: async (data: any) => {
    return apiClient.post(endpoints.salons.all.path(), data);
  },

  updateSalon: async (id: string, data: any) => {
    return apiClient.put(endpoints.salons.detail.path(id), data);
  },

  deleteSalon: async (id: string) => {
    return apiClient.delete(endpoints.salons.detail.path(id));
  },

  approveSalon: async (id: string) => {
    return apiClient.post(endpoints.salons.approve.path(id));
  },

  getSales: async (salonId: string, params: any) => {
    return apiClient.get(endpoints.salons.sales.path(salonId), params);
  },

  // Settings API
  getSettings: async (salonId: string): Promise<ApiResponse<{
    businessHours: BusinessHours[];
    holidays: Holiday[];
    settings: any;
  }>> => {
    return apiClient.get(endpoints.salons.settings.path(salonId));
  },

  updateSettings: async (salonId: string, data: {
    businessHours?: BusinessHours[];
    holidays?: Holiday[];
    settings?: any;
  }): Promise<ApiResponse> => {
    return apiClient.patch(endpoints.salons.settings.path(salonId), data);
  },
};
