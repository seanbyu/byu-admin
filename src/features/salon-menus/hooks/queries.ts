'use client';

// ============================================
// TanStack Query Keys & Options for Salon Menus
// ============================================

// Query Keys Factory
export const industryKeys = {
  all: ['industries'] as const,
  list: (salonId: string) => [...industryKeys.all, salonId] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  list: (salonId: string) => [...categoryKeys.all, salonId] as const,
};

export const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (salonId: string) => [...menuKeys.lists(), salonId] as const,
  listByCategory: (salonId: string, categoryId: string | undefined) =>
    [...menuKeys.list(salonId), categoryId || 'all'] as const,
};

// Default Query Options
export const INDUSTRIES_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 10, // 10분 (업종은 자주 안 바뀜)
  gcTime: 1000 * 60 * 60, // 1시간
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const CATEGORIES_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5분
  gcTime: 1000 * 60 * 30, // 30분
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const MENUS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 3, // 3분
  gcTime: 1000 * 60 * 20, // 20분
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
