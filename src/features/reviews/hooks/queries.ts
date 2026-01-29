'use client';

// ============================================
// TanStack Query Keys & Options for Reviews
// ============================================

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (params?: unknown) => [...reviewKeys.lists(), params] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (reviewId: string) => [...reviewKeys.details(), reviewId] as const,
};

export const REVIEWS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5분
  gcTime: 1000 * 60 * 30, // 30분
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
