'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSalonMenusApi } from '../api';
import {
  SalonMenu,
  MenuCategory,
  IndustriesResponse,
} from '../types';
import {
  industryKeys,
  categoryKeys,
  menuKeys,
  INDUSTRIES_QUERY_OPTIONS,
  CATEGORIES_QUERY_OPTIONS,
  MENUS_QUERY_OPTIONS,
} from './queries';

const salonMenusApi = createSalonMenusApi();

// ============================================
// Industries Hook
// ============================================
export const useIndustries = (salonId: string) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => industryKeys.list(salonId), [salonId]);

  const query = useQuery<IndustriesResponse>({
    queryKey,
    queryFn: async () => {
      const response = await salonMenusApi.getIndustries(salonId);
      if (!response.data) throw new Error('No data received');
      return response.data;
    },
    enabled: !!salonId,
    ...INDUSTRIES_QUERY_OPTIONS,
  });

  const invalidateIndustries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const toggleMutation = useMutation({
    mutationFn: ({ industryId, isSelected }: { industryId: string; isSelected: boolean }) =>
      salonMenusApi.toggleIndustry(
        salonId,
        industryId,
        isSelected ? 'remove_industry' : 'add_industry'
      ),
    onSuccess: invalidateIndustries,
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIndustryIds: string[]) =>
      salonMenusApi.reorderIndustries(salonId, orderedIndustryIds),
    onSuccess: invalidateIndustries,
  });

  const industries = useMemo(() => query.data?.all || [], [query.data?.all]);
  const selectedIndustries = useMemo(() => query.data?.selected || [], [query.data?.selected]);

  return useMemo(
    () => ({
      data: query.data,
      industries,
      selectedIndustries,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      toggleIndustry: toggleMutation.mutateAsync,
      reorderIndustries: reorderMutation.mutateAsync,
      isToggling: toggleMutation.isPending,
      isReordering: reorderMutation.isPending,
    }),
    [
      query.data,
      industries,
      selectedIndustries,
      query.isLoading,
      query.isFetching,
      query.error,
      toggleMutation.mutateAsync,
      reorderMutation.mutateAsync,
      toggleMutation.isPending,
      reorderMutation.isPending,
    ]
  );
};

// ============================================
// Categories Hook
// ============================================
export const useCategories = (salonId: string) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => categoryKeys.list(salonId), [salonId]);

  const query = useQuery<MenuCategory[]>({
    queryKey,
    queryFn: async () => {
      const response = await salonMenusApi.getCategories(salonId);
      if (!response.data) throw new Error('No data received');
      return response.data;
    },
    enabled: !!salonId,
    ...CATEGORIES_QUERY_OPTIONS,
  });

  const invalidateCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const createMutation = useMutation({
    mutationFn: ({ name, displayOrder, industryId }: { name: string; displayOrder: number; industryId?: string }) =>
      salonMenusApi.createCategory(salonId, name, displayOrder, industryId),
    onSuccess: invalidateCategories,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      salonMenusApi.updateCategory(salonId, id, { name }),
    onSuccess: invalidateCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salonMenusApi.deleteCategory(salonId, id),
    onSuccess: invalidateCategories,
  });

  const reorderMutation = useMutation({
    mutationFn: (categories: { id: string; display_order: number }[]) =>
      salonMenusApi.updateCategoryOrder(salonId, categories),
    onSuccess: invalidateCategories,
  });

  const categories = useMemo(() => query.data || [], [query.data]);

  return useMemo(
    () => ({
      data: query.data,
      categories,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      createCategory: createMutation.mutateAsync,
      updateCategory: updateMutation.mutateAsync,
      deleteCategory: deleteMutation.mutateAsync,
      reorderCategories: reorderMutation.mutateAsync,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isReordering: reorderMutation.isPending,
    }),
    [
      query.data,
      categories,
      query.isLoading,
      query.isFetching,
      query.error,
      createMutation.mutateAsync,
      updateMutation.mutateAsync,
      deleteMutation.mutateAsync,
      reorderMutation.mutateAsync,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      reorderMutation.isPending,
    ]
  );
};

// ============================================
// Menu Mutations Only Hook (query 없이 mutation만 — N+1 방지용)
// MenuItems에서 부모의 allMenus 캐시를 그대로 사용할 때 사용
// ============================================
export const useMenuMutations = (salonId: string, categoryId: string) => {
  const queryClient = useQueryClient();

  const invalidateMenus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: menuKeys.list(salonId) });
  }, [queryClient, salonId]);

  const createMutation = useMutation({
    mutationFn: (menuData: Omit<SalonMenu, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder' | 'categoryId'>) =>
      salonMenusApi.createMenu(salonId, categoryId, menuData),
    onSuccess: invalidateMenus,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salonMenusApi.deleteMenu(salonId, id),
    onSuccess: invalidateMenus,
  });

  const reorderMutation = useMutation({
    mutationFn: (menus: { id: string; display_order: number }[]) =>
      salonMenusApi.reorderMenus(salonId, menus),
    onSuccess: invalidateMenus,
  });

  return useMemo(
    () => ({
      createMenu: createMutation.mutateAsync,
      deleteMenu: deleteMutation.mutateAsync,
      reorderMenus: reorderMutation.mutateAsync,
      isCreating: createMutation.isPending,
    }),
    [
      createMutation.mutateAsync,
      deleteMutation.mutateAsync,
      reorderMutation.mutateAsync,
      createMutation.isPending,
    ]
  );
};

// ============================================
// Menus Hook
// ============================================
export const useMenus = (
  salonId: string,
  categoryId?: string,
  options?: { enabled?: boolean }
) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => menuKeys.listByCategory(salonId, categoryId),
    [salonId, categoryId]
  );

  const query = useQuery<SalonMenu[]>({
    queryKey,
    queryFn: async () => {
      const response = await salonMenusApi.getMenus(salonId, categoryId);
      if (!response.data) throw new Error('No data received');
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!salonId,
    ...MENUS_QUERY_OPTIONS,
  });

  const invalidateMenus = useCallback(() => {
    // Invalidate all menus for this salon (including category-specific)
    queryClient.invalidateQueries({ queryKey: menuKeys.list(salonId) });
  }, [queryClient, salonId]);

  const createMutation = useMutation({
    mutationFn: (menuData: Omit<SalonMenu, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder' | 'categoryId'>) => {
      if (!categoryId) throw new Error('Category ID is required');
      return salonMenusApi.createMenu(salonId, categoryId, menuData);
    },
    onSuccess: invalidateMenus,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; price?: number; duration?: number } }) =>
      salonMenusApi.updateMenu(salonId, id, updates),
    onSuccess: (_data, { id, updates }) => {
      // refetch 없이 캐시를 직접 업데이트 → 저장 후 버벅거림 방지
      queryClient.setQueryData<SalonMenu[]>(
        menuKeys.listByCategory(salonId, undefined),
        (old) =>
          old?.map((menu) =>
            menu.id === id
              ? {
                  ...menu,
                  name: updates.name ?? menu.name,
                  base_price: updates.price ?? menu.base_price,
                  price: updates.price ?? menu.price,
                  duration_minutes: updates.duration ?? menu.duration_minutes,
                }
              : menu
          )
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salonMenusApi.deleteMenu(salonId, id),
    onSuccess: invalidateMenus,
  });

  const reorderMutation = useMutation({
    mutationFn: (menus: { id: string; display_order: number }[]) =>
      salonMenusApi.reorderMenus(salonId, menus),
    onSuccess: invalidateMenus,
  });

  const menus = useMemo(() => query.data || [], [query.data]);

  return useMemo(
    () => ({
      data: query.data,
      menus,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      createMenu: createMutation.mutateAsync,
      updateMenu: updateMutation.mutateAsync,
      deleteMenu: deleteMutation.mutateAsync,
      reorderMenus: reorderMutation.mutateAsync,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isReordering: reorderMutation.isPending,
    }),
    [
      query.data,
      menus,
      query.isLoading,
      query.isFetching,
      query.error,
      createMutation.mutateAsync,
      updateMutation.mutateAsync,
      deleteMutation.mutateAsync,
      reorderMutation.mutateAsync,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      reorderMutation.isPending,
    ]
  );
};
