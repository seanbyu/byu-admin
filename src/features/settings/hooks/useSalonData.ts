'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
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
// Direct Supabase Query Hook
// 설정 페이지 전용 - 사이드바 쿼리와 분리
// ============================================

export function useSalonData(salonId: string) {
  const queryClient = useQueryClient();

  const query = useQuery<SalonData | null>({
    queryKey: settingsKeys.storeInfoDirect(salonId),
    queryFn: async () => {
      if (!salonId) return null;

      const { data, error } = await supabase
        .from('salons')
        .select('name, address, cover_image_url, settings')
        .eq('id', salonId)
        .single();

      if (error) {
        console.error('Salon query error:', error);
        return null;
      }

      return data as SalonData;
    },
    enabled: !!salonId,
    staleTime: 0, // 항상 fresh 데이터 요청
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
