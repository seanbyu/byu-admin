'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSalonMenusApi } from '../api';
import { supabase } from '@/lib/supabase/client';
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

const salonMenusApi = createSalonMenusApi(supabase);

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
    mutationFn: useCallback(
      ({ industryId, isSelected }: { industryId: string; isSelected: boolean }) =>
        salonMenusApi.toggleIndustry(
          salonId,
          industryId,
          isSelected ? 'remove_industry' : 'add_industry'
        ),
      [salonId]
    ),
    onSuccess: invalidateIndustries,
  });

  const reorderMutation = useMutation({
    mutationFn: useCallback(
      (orderedIndustryIds: string[]) =>
        salonMenusApi.reorderIndustries(salonId, orderedIndustryIds),
      [salonId]
    ),
    onSuccess: invalidateIndustries,
  });

  // Memoized data
  const industries = useMemo(() => query.data?.all || [], [query.data?.all]);
  const selectedIndustries = useMemo(() => query.data?.selected || [], [query.data?.selected]);

  // Memoized functions
  const toggleIndustry = useCallback(
    (params: { industryId: string; isSelected: boolean }) =>
      toggleMutation.mutateAsync(params),
    [toggleMutation]
  );

  const reorderIndustries = useCallback(
    (orderedIds: string[]) => reorderMutation.mutateAsync(orderedIds),
    [reorderMutation]
  );

  return useMemo(
    () => ({
      data: query.data,
      industries,
      selectedIndustries,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      toggleIndustry,
      reorderIndustries,
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
      toggleIndustry,
      reorderIndustries,
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
    mutationFn: useCallback(
      ({ name, displayOrder, industryId }: { name: string; displayOrder: number; industryId?: string }) =>
        salonMenusApi.createCategory(salonId, name, displayOrder, industryId),
      [salonId]
    ),
    onSuccess: invalidateCategories,
  });

  const updateMutation = useMutation({
    mutationFn: useCallback(
      ({ id, name }: { id: string; name: string }) =>
        salonMenusApi.updateCategory(salonId, id, { name }),
      [salonId]
    ),
    onSuccess: invalidateCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => salonMenusApi.deleteCategory(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateCategories,
  });

  const reorderMutation = useMutation({
    mutationFn: useCallback(
      (categories: { id: string; display_order: number }[]) =>
        salonMenusApi.updateCategoryOrder(salonId, categories),
      [salonId]
    ),
    onSuccess: invalidateCategories,
  });

  // Memoized data
  const categories = useMemo(() => query.data || [], [query.data]);

  // Memoized functions
  const createCategory = useCallback(
    (params: { name: string; displayOrder: number; industryId?: string }) =>
      createMutation.mutateAsync(params),
    [createMutation]
  );

  const updateCategory = useCallback(
    (params: { id: string; name: string }) => updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const deleteCategory = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  const reorderCategories = useCallback(
    (categories: { id: string; display_order: number }[]) =>
      reorderMutation.mutateAsync(categories),
    [reorderMutation]
  );

  return useMemo(
    () => ({
      data: query.data,
      categories,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      createCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,
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
      createCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      reorderMutation.isPending,
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
    mutationFn: useCallback(
      (menuData: Omit<SalonMenu, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder' | 'categoryId'>) => {
        if (!categoryId) throw new Error('Category ID is required');
        return salonMenusApi.createMenu(salonId, categoryId, menuData);
      },
      [salonId, categoryId]
    ),
    onSuccess: invalidateMenus,
  });

  const updateMutation = useMutation({
    mutationFn: useCallback(
      ({ id, updates }: { id: string; updates: { name?: string; price?: number; duration?: number } }) =>
        salonMenusApi.updateMenu(salonId, id, updates),
      [salonId]
    ),
    onSuccess: invalidateMenus,
  });

  const deleteMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => salonMenusApi.deleteMenu(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateMenus,
  });

  const reorderMutation = useMutation({
    mutationFn: useCallback(
      (menus: { id: string; display_order: number }[]) =>
        salonMenusApi.reorderMenus(salonId, menus),
      [salonId]
    ),
    onSuccess: invalidateMenus,
  });

  // Memoized data
  const menus = useMemo(() => query.data || [], [query.data]);

  // Memoized functions
  const createMenu = useCallback(
    (menuData: Omit<SalonMenu, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder' | 'categoryId'>) =>
      createMutation.mutateAsync(menuData),
    [createMutation]
  );

  const updateMenu = useCallback(
    (params: { id: string; updates: { name?: string; price?: number; duration?: number } }) =>
      updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const deleteMenu = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  const reorderMenus = useCallback(
    (menus: { id: string; display_order: number }[]) =>
      reorderMutation.mutateAsync(menus),
    [reorderMutation]
  );

  return useMemo(
    () => ({
      data: query.data,
      menus,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      createMenu,
      updateMenu,
      deleteMenu,
      reorderMenus,
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
      createMenu,
      updateMenu,
      deleteMenu,
      reorderMenus,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
      reorderMutation.isPending,
    ]
  );
};
