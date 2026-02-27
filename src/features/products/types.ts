export interface ProductCategory {
  id: string;
  salon_id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  salon_id: string;
  category_id?: string | null;
  name: string;
  name_en?: string | null;
  name_th?: string | null;
  description?: string | null;
  price: number;
  stock_quantity: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type ProductFormData = Pick<Product, 'name' | 'description' | 'price' | 'stock_quantity' | 'is_active'>;
