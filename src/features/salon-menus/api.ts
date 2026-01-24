import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { SupabaseClient } from '@supabase/supabase-js';
import { IndustriesResponse, MenuCategory, SalonMenu } from './types';
import { ApiResponse } from '@/types';

// Client arg unused
export const createSalonMenusApi = (client?: SupabaseClient<any>) => {
  return {
    getIndustries: async (
      salonId: string
    ): Promise<ApiResponse<IndustriesResponse>> => {
      // GET /salons/[id]/menus?type=industries
      return apiClient.get(endpoints.salons.menus.path(salonId), {
        type: 'industries',
      });
    },

    toggleIndustry: async (
      salonId: string,
      industryId: string,
      action: 'add_industry' | 'remove_industry'
    ) => {
      return apiClient.post(endpoints.salons.menus.path(salonId), {
        action,
        industryId,
      });
    },

    reorderIndustries: (salonId: string, orderedIndustryIds: string[]) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'reorder_industries',
        orderedIndustryIds,
      }),

    getCategories: (salonId: string): Promise<ApiResponse<MenuCategory[]>> =>
      apiClient.get(endpoints.salons.menus.path(salonId), {
        type: 'categories',
      }),

    createCategory: (
      salonId: string,
      name: string,
      displayOrder: number,
      industryId?: string
    ) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'create_category',
        name,
        displayOrder,
        industryId,
      }),

    deleteCategory: (salonId: string, id: string) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'delete_category',
        id,
      }),

    updateCategory: (
      salonId: string,
      categoryId: string,
      updates: {
        name?: string;
        displayOrder?: number;
        industryId?: string | null;
      }
    ) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'update_category',
        id: categoryId,
        updates,
      }),

    getMenus: (
      salonId: string,
      categoryId?: string
    ): Promise<ApiResponse<SalonMenu[]>> => {
      const params: Record<string, string> = { type: 'menus' };
      if (categoryId) {
        params.categoryId = categoryId;
      }
      return apiClient.get(endpoints.salons.menus.path(salonId), params);
    },

    createMenu: (
      salonId: string,
      categoryId: string,
      menuData: Omit<
        SalonMenu,
        'id' | 'createdAt' | 'updatedAt' | 'displayOrder' | 'categoryId'
      >
    ) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'create_menu',
        categoryId,
        menuData,
      }),

    deleteMenu: (salonId: string, id: string) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'delete_menu',
        id,
      }),

    updateMenu: (
      salonId: string,
      id: string,
      updates: { name?: string; price?: number; duration?: number }
    ) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'update_menu',
        id,
        updates,
      }),

    updateCategoryOrder: (
      salonId: string,
      categories: { id: string; display_order: number }[]
    ) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'reorder_categories',
        categories,
      }),

    reorderMenus: (
      salonId: string,
      menus: { id: string; display_order: number }[]
    ) =>
      apiClient.post(endpoints.salons.menus.path(salonId), {
        action: 'reorder_menus',
        menus,
      }),
  };
};
