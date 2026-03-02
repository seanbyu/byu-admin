import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Product, ProductCategory } from './types';

const path = (salonId: string) => endpoints.salons.products.path(salonId);

export const productsApi = {
  // ─── Categories ───────────────────────────────────────
  getCategories: async (salonId: string): Promise<ProductCategory[]> => {
    const res = await apiClient.get<ProductCategory[]>(path(salonId), { type: 'categories' });
    return res.data ?? [];
  },

  createCategory: async (
    salonId: string,
    name: string,
    displayOrder: number
  ): Promise<ProductCategory> => {
    const res = await apiClient.post<ProductCategory>(path(salonId), {
      action: 'create_category',
      name,
      displayOrder,
    });
    return res.data!;
  },

  updateCategory: async (salonId: string, id: string, name: string): Promise<ProductCategory> => {
    const res = await apiClient.post<ProductCategory>(path(salonId), {
      action: 'update_category',
      id,
      name,
    });
    return res.data!;
  },

  deleteCategory: async (salonId: string, id: string): Promise<void> => {
    await apiClient.post(path(salonId), {
      action: 'delete_category',
      id,
    });
  },

  reorderCategories: async (
    salonId: string,
    categories: { id: string; display_order: number }[]
  ): Promise<void> => {
    await apiClient.post(path(salonId), {
      action: 'reorder_categories',
      categories,
    });
  },

  // ─── Products ─────────────────────────────────────────
  getProducts: async (salonId: string, categoryId?: string): Promise<Product[]> => {
    const res = await apiClient.get<Product[]>(path(salonId), {
      type: 'products',
      ...(categoryId ? { categoryId } : {}),
    });
    return res.data ?? [];
  },

  createProduct: async (
    salonId: string,
    categoryId: string,
    data: { name: string; price: number; displayOrder: number }
  ): Promise<Product> => {
    const res = await apiClient.post<Product>(path(salonId), {
      action: 'create_product',
      categoryId,
      productData: data,
    });
    return res.data!;
  },

  updateProduct: async (
    salonId: string,
    id: string,
    updates: Partial<Product>
  ): Promise<Product> => {
    const res = await apiClient.post<Product>(path(salonId), {
      action: 'update_product',
      id,
      updates,
    });
    return res.data!;
  },

  deleteProduct: async (salonId: string, id: string): Promise<void> => {
    await apiClient.post(path(salonId), {
      action: 'delete_product',
      id,
    });
  },

  reorderProducts: async (
    salonId: string,
    products: { id: string; display_order: number }[]
  ): Promise<void> => {
    await apiClient.post(path(salonId), {
      action: 'reorder_products',
      products,
    });
  },
};
