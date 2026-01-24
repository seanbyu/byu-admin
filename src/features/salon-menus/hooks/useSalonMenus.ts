import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSalonMenusApi } from '../api';
import { supabase } from '@/lib/supabase/client';
import {
  SalonMenu,
  MenuCategory,
  SalonIndustry,
  IndustriesResponse,
} from '../types';

const salonMenusApi = createSalonMenusApi(supabase);

export const useIndustries = (salonId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<IndustriesResponse>({
    queryKey: ['industries', salonId],
    queryFn: async () => {
      const response = await salonMenusApi.getIndustries(salonId);
      if (!response.data) throw new Error('No data received');
      return response.data;
    },
    enabled: !!salonId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      industryId,
      isSelected,
    }: {
      industryId: string;
      isSelected: boolean;
    }) =>
      salonMenusApi.toggleIndustry(
        salonId,
        industryId,
        isSelected ? 'remove_industry' : 'add_industry'
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries', salonId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIndustryIds: string[]) =>
      salonMenusApi.reorderIndustries(salonId, orderedIndustryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries', salonId] });
    },
  });

  return {
    ...query,
    toggleIndustry: toggleMutation.mutateAsync,
    reorderIndustries: reorderMutation.mutateAsync,
  };
};

export const useCategories = (salonId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<MenuCategory[]>({
    queryKey: ['categories', salonId],
    queryFn: async () => {
      const response = await salonMenusApi.getCategories(salonId);
      if (!response.data) throw new Error('No data received');
      return response.data;
    },
    enabled: !!salonId,
  });

  const createMutation = useMutation({
    mutationFn: ({
      name,
      displayOrder,
      industryId,
    }: {
      name: string;
      displayOrder: number;
      industryId?: string;
    }) => salonMenusApi.createCategory(salonId, name, displayOrder, industryId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['categories', salonId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salonMenusApi.deleteCategory(salonId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['categories', salonId] }),
  });

  return {
    ...query,
    createCategory: createMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    updateCategory: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        salonMenusApi.updateCategory(salonId, id, { name }),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ['categories', salonId] }),
    }).mutateAsync,
    reorderCategories: useMutation({
      mutationFn: (categories: { id: string; display_order: number }[]) =>
        salonMenusApi.updateCategoryOrder(salonId, categories),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ['categories', salonId] }),
    }).mutateAsync,
  };
};

export const useMenus = (
  salonId: string,
  categoryId?: string,
  options?: { enabled?: boolean }
) => {
  const queryClient = useQueryClient();

  const query = useQuery<SalonMenu[]>({
    queryKey: ['menus', salonId, categoryId || 'all'],
    queryFn: async () => {
      const response = await salonMenusApi.getMenus(salonId, categoryId);
      if (!response.data) throw new Error('No data received');
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!salonId,
  });

  const createMutation = useMutation({
    mutationFn: (menuData: any) => {
      if (!categoryId) throw new Error('Category ID is required');
      return salonMenusApi.createMenu(salonId, categoryId, menuData);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        // Invalidate both specific category and all menus to update counts
        queryKey: ['menus', salonId],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salonMenusApi.deleteMenu(salonId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['menus', salonId],
      }),
  });

  return {
    ...query,
    createMenu: createMutation.mutateAsync,
    deleteMenu: deleteMutation.mutateAsync,
    updateMenu: useMutation({
      mutationFn: ({
        id,
        updates,
      }: {
        id: string;
        updates: { name?: string; price?: number; duration?: number };
      }) => salonMenusApi.updateMenu(salonId, id, updates),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ['menus', salonId] }),
    }).mutateAsync,
    reorderMenus: useMutation({
      mutationFn: (menus: { id: string; display_order: number }[]) =>
        salonMenusApi.reorderMenus(salonId, menus),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ['menus', salonId] }),
    }).mutateAsync,
  };
};
