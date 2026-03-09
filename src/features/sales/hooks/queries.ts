'use client';

export const salesKeys = {
  all: ['sales'] as const,
  list: (salonId: string, startDate: string, endDate: string) =>
    [...salesKeys.all, 'list', salonId, startDate, endDate] as const,
};

export const SALES_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5,   // 5분
  gcTime: 1000 * 60 * 30,     // 30분
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
