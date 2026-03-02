import { BaseRepository } from './base.repository';
import { ProductCategory, Product } from '@/features/products/types';

export class ProductRepository extends BaseRepository {
  // ─── Categories ───────────────────────────────────────

  async getCategories(salonId: string): Promise<ProductCategory[]> {
    const { data, error } = await (this.supabase as any)
      .from('product_categories')
      .select('*')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as ProductCategory[]) || [];
  }

  async createCategory(
    salonId: string,
    name: string,
    displayOrder: number
  ): Promise<ProductCategory> {
    const { data, error } = await (this.supabase as any)
      .from('product_categories')
      .insert({ salon_id: salonId, name, display_order: displayOrder })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProductCategory;
  }

  async updateCategory(id: string, name: string): Promise<ProductCategory> {
    const { data, error } = await (this.supabase as any)
      .from('product_categories')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProductCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async reorderCategories(
    categories: { id: string; display_order: number }[]
  ): Promise<void> {
    const results = await Promise.all(
      categories.map((cat) =>
        (this.supabase as any)
          .from('product_categories')
          .update({ display_order: cat.display_order })
          .eq('id', cat.id)
      )
    );
    const err = results.find((r: any) => r.error)?.error;
    if (err) throw new Error(err.message);
  }

  // ─── Products ─────────────────────────────────────────

  async getProducts(salonId: string, categoryId?: string): Promise<Product[]> {
    let query = (this.supabase as any)
      .from('salon_products')
      .select('*')
      .eq('salon_id', salonId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as Product[]) || [];
  }

  async createProduct(
    salonId: string,
    categoryId: string,
    productData: { name: string; price: number; displayOrder: number }
  ): Promise<Product> {
    const { data, error } = await (this.supabase as any)
      .from('salon_products')
      .insert({
        salon_id: salonId,
        category_id: categoryId,
        name: productData.name,
        price: productData.price,
        display_order: productData.displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await (this.supabase as any)
      .from('salon_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('salon_products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async reorderProducts(
    products: { id: string; display_order: number }[]
  ): Promise<void> {
    const results = await Promise.all(
      products.map((p) =>
        (this.supabase as any)
          .from('salon_products')
          .update({ display_order: p.display_order })
          .eq('id', p.id)
      )
    );
    const err = results.find((r: any) => r.error)?.error;
    if (err) throw new Error(err.message);
  }
}
