'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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
  const queryClient = useQueryClient();

  const query = useQuery<SalonData | null>({
    queryKey: settingsKeys.storeInfoDirect(salonId),
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
    staleTime: 0,
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: settingsKeys.storeInfoDirect(salonId),
    });
  }, [queryClient, salonId]);

  return {
    salonData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  };
}
