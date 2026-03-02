import { apiClient } from '@/lib/api/client';

export interface LineSettings {
  id: string;
  salonId: string;
  lineChannelId: string;
  lineChannelSecret: string;
  lineChannelAccessToken: string;
  liffId: string;
  isActive: boolean;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationError: string | null;
}

const path = (salonId: string) => `/salons/${salonId}/line-settings`;

export const lineSettingsApi = {
  get: async (salonId: string): Promise<LineSettings | null> => {
    const res = await apiClient.get<LineSettings | null>(path(salonId));
    return res.data ?? null;
  },

  upsert: async (
    salonId: string,
    settings: {
      lineChannelId: string;
      lineChannelSecret: string;
      lineChannelAccessToken: string;
      liffId?: string;
    }
  ): Promise<LineSettings> => {
    const res = await apiClient.post<LineSettings>(path(salonId), {
      action: 'upsert',
      ...settings,
    });
    return res.data!;
  },

  toggleActive: async (salonId: string, isActive: boolean): Promise<void> => {
    await apiClient.post(path(salonId), {
      action: 'toggle_active',
      isActive,
    });
  },

  delete: async (salonId: string): Promise<void> => {
    await apiClient.post(path(salonId), { action: 'delete' });
  },

  verify: async (salonId: string): Promise<{ success: boolean; error?: string }> => {
    const res = await apiClient.post<{ success: boolean; error?: string }>(
      path(salonId),
      { action: 'verify' }
    );
    return res.data ?? { success: false, error: 'No response' };
  },
};
