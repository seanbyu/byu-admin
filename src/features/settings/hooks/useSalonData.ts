'use client';

import { useMemo } from 'react';
import { useStoreInfo } from './useSettings';

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
// useStoreInfo를 내부적으로 사용해 캐시 구조 일관성 유지
// (동일한 캐시 키에 서로 다른 queryFn을 등록하면 데이터 구조 불일치 발생)
// ============================================

export function useSalonData(salonId: string) {
  const { storeInfo, isLoading, error, refetch } = useStoreInfo(salonId);

  const salonData = useMemo<SalonData | null>(() => {
    if (!storeInfo) return null;
    return {
      name: storeInfo.name,
      address: storeInfo.address || null,
      cover_image_url: storeInfo.imageUrl || null,
      settings: storeInfo.instagramUrl ? { instagram_url: storeInfo.instagramUrl } : null,
    };
  }, [storeInfo]);

  return {
    salonData,
    isLoading,
    error,
    refetch,
  };
}
