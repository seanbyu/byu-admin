'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api';
import { settingsKeys } from './useSettings';

// ============================================
// Salon Data Types
// ============================================

export interface SalonData {
  name: string;
  address: string | null;
  cover_image_url: string | null;
  settings: {
    instagram_url?: string;
  } | null;
}

// ============================================
// useSalonData Hook
// 설정 페이지 전용 - settingsApi 경유 (apiClient 패턴)
// ============================================

export function useSalonData(salonId: string) {
  const query = useQuery<SalonData | null>({
    queryKey: settingsKeys.storeInfo(salonId),
    queryFn: async () => {
      if (!salonId) return null;

      const res = await settingsApi.getStoreInfo(salonId);
      if (!res.data) return null;

      const d = res.data;
      return {
        name: d.name,
        address: d.address || null,
        cover_image_url: d.imageUrl || null,
        settings: d.instagramUrl ? { instagram_url: d.instagramUrl } : null,
      };
    },
    enabled: !!salonId,
    staleTime: 1000 * 60 * 5,  // 5분 (설정 데이터는 자주 변경되지 않음)
    gcTime: 1000 * 60 * 30,    // 30분
  });

  return {
    salonData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
