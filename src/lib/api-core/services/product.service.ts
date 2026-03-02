import { ProductRepository } from '../repositories/product.repository';
import { Client } from '../types';
import { ProductCategory, Product } from '@/features/products/types';

export class ProductService {
  private repository: ProductRepository;

  constructor(client: Client) {
    this.repository = new ProductRepository(client);
  }

  // ─── Categories ───────────────────────────────────────

  async getCategories(salonId: string): Promise<ProductCategory[]> {
    return this.repository.getCategories(salonId);
  }

  async createCategory(
    salonId: string,
    name: string,
    displayOrder: number
  ): Promise<ProductCategory> {
    return this.repository.createCategory(salonId, name, displayOrder);
  }

  async updateCategory(id: string, name: string): Promise<ProductCategory> {
    return this.repository.updateCategory(id, name);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.repository.deleteCategory(id);
  }

  async reorderCategories(
    categories: { id: string; display_order: number }[]
  ): Promise<void> {
    return this.repository.reorderCategories(categories);
  }

  // ─── Products ─────────────────────────────────────────

  async getProducts(salonId: string, categoryId?: string): Promise<Product[]> {
    return this.repository.getProducts(salonId, categoryId);
  }

  async createProduct(
    salonId: string,
    categoryId: string,
    productData: { name: string; price: number; displayOrder: number }
  ): Promise<Product> {
    return this.repository.createProduct(salonId, categoryId, productData);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.repository.updateProduct(id, updates);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.repository.deleteProduct(id);
  }

  async reorderProducts(
    products: { id: string; display_order: number }[]
  ): Promise<void> {
    return this.repository.reorderProducts(products);
  }
}
