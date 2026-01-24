import { SupabaseClient } from "@supabase/supabase-js";
import { MenuRepository } from "../repositories/menu.repository";

export class SalonMenuService {
  private repository: MenuRepository;

  constructor(private client: SupabaseClient<any>) {
    this.repository = new MenuRepository(this.client);
  }

  async getIndustries(salonId: string) {
    return this.repository.getIndustries(salonId);
  }

  async addSalonIndustry(salonId: string, industryId: string) {
    return this.repository.addSalonIndustry(salonId, industryId);
  }

  async removeSalonIndustry(salonId: string, industryId: string) {
    return this.repository.removeSalonIndustry(salonId, industryId);
  }

  async reorderIndustries(salonId: string, orderedIndustryIds: string[]) {
    return this.repository.reorderIndustries(salonId, orderedIndustryIds);
  }

  async getCategories(salonId: string) {
    return this.repository.getCategories(salonId);
  }

  async createCategory(
    salonId: string,
    name: string,
    displayOrder: number,
    industryId?: string
  ) {
    return this.repository.createCategory(
      salonId,
      name,
      displayOrder,
      industryId
    );
  }

  async deleteCategory(categoryId: string) {
    return this.repository.deleteCategory(categoryId);
  }

  async updateCategory(
    categoryId: string,
    updates: {
      name?: string;
      displayOrder?: number;
      industryId?: string | null;
    }
  ) {
    return this.repository.updateCategory(categoryId, updates);
  }

  async reorderCategories(
    salonId: string,
    categories: { id: string; display_order: number }[]
  ) {
    return this.repository.reorderCategories(salonId, categories);
  }

  async getMenus(salonId: string, categoryId?: string) {
    return this.repository.getMenus(salonId, categoryId);
  }

  async createMenu(salonId: string, categoryId: string, menuData: any) {
    return this.repository.createMenu(salonId, categoryId, menuData);
  }

  async deleteMenu(menuId: string) {
    return this.repository.deleteMenu(menuId);
  }

  async updateMenu(
    menuId: string,
    updates: { name?: string; price?: number; duration?: number }
  ) {
    return this.repository.updateMenu(menuId, updates);
  }

  async reorderMenus(
    salonId: string,
    menus: { id: string; display_order: number }[]
  ) {
    return this.repository.reorderMenus(salonId, menus);
  }
}
