import { supabase } from '@/lib/supabase/client';
import { Product, ProductCategory } from './types';

export const productsApi = {
  // ─── Categories ───────────────────────────────────────
  getCategories: async (salonId: string): Promise<ProductCategory[]> => {
    const { data, error } = await (supabase as any)
      .from('product_categories')
      .select('*')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as ProductCategory[]) || [];
  },

  createCategory: async (salonId: string, name: string, displayOrder: number): Promise<ProductCategory> => {
    const { data, error } = await (supabase as any)
      .from('product_categories')
      .insert({
        salon_id: salonId,
        name,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProductCategory;
  },

  updateCategory: async (id: string, name: string): Promise<ProductCategory> => {
    const { data, error } = await (supabase as any)
      .from('product_categories')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProductCategory;
  },

  deleteCategory: async (id: string): Promise<void> => {
    const { error } = await (supabase as any)
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  reorderCategories: async (categories: { id: string; display_order: number }[]): Promise<void> => {
    const promises = categories.map((cat) =>
      (supabase as any)
        .from('product_categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id)
    );
    const results = await Promise.all(promises);
    const error = results.find((r) => r.error)?.error;
    if (error) throw error;
  },

  // ─── Products ─────────────────────────────────────────
  getProducts: async (salonId: string, categoryId?: string): Promise<Product[]> => {
    let query = (supabase as any)
      .from('salon_products')
      .select('*')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Product[]) || [];
  },

  createProduct: async (
    salonId: string,
    categoryId: string,
    data: { name: string; price: number; displayOrder: number }
  ): Promise<Product> => {
    const { data: result, error } = await (supabase as any)
      .from('salon_products')
      .insert({
        salon_id: salonId,
        category_id: categoryId,
        name: data.name,
        price: data.price,
        display_order: data.displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return result as Product;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    const { data, error } = await (supabase as any)
      .from('salon_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await (supabase as any)
      .from('salon_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  reorderProducts: async (products: { id: string; display_order: number }[]): Promise<void> => {
    const promises = products.map((p) =>
      (supabase as any)
        .from('salon_products')
        .update({ display_order: p.display_order })
        .eq('id', p.id)
    );
    const results = await Promise.all(promises);
    const error = results.find((r) => r.error)?.error;
    if (error) throw error;
  },
};
