import { MenuRepository } from "../repositories/menu.repository";
import {
  Client,
  DBServiceCategory,
  DBService,
  CreateMenuDto,
  UpdateMenuDto,
  UpdateCategoryDto,
  IndustriesResponse,
} from "../types";

export class SalonMenuService {
  private repository: MenuRepository;

  constructor(private client: Client) {
    this.repository = new MenuRepository(this.client);
  }

  async getIndustries(salonId: string): Promise<IndustriesResponse> {
    return this.repository.getIndustries(salonId);
  }

  async addSalonIndustry(salonId: string, industryId: string): Promise<void> {
    return this.repository.addSalonIndustry(salonId, industryId);
  }

  async removeSalonIndustry(salonId: string, industryId: string): Promise<void> {
    return this.repository.removeSalonIndustry(salonId, industryId);
  }

  async reorderIndustries(
    salonId: string,
    orderedIndustryIds: string[]
  ): Promise<void> {
    return this.repository.reorderIndustries(salonId, orderedIndustryIds);
  }

  async getCategories(salonId: string): Promise<DBServiceCategory[]> {
    return this.repository.getCategories(salonId);
  }

  async createCategory(
    salonId: string,
    name: string,
    displayOrder: number,
    industryId?: string
  ): Promise<DBServiceCategory> {
    return this.repository.createCategory(
      salonId,
      name,
      displayOrder,
      industryId
    );
  }

  async deleteCategory(categoryId: string): Promise<void> {
    return this.repository.deleteCategory(categoryId);
  }

  async updateCategory(
    categoryId: string,
    updates: UpdateCategoryDto
  ): Promise<DBServiceCategory> {
    return this.repository.updateCategory(categoryId, updates);
  }

  async reorderCategories(
    salonId: string,
    categories: { id: string; display_order: number }[]
  ): Promise<void> {
    return this.repository.reorderCategories(salonId, categories);
  }

  async getMenus(salonId: string, categoryId?: string): Promise<DBService[]> {
    return this.repository.getMenus(salonId, categoryId);
  }

  async createMenu(
    salonId: string,
    categoryId: string,
    menuData: CreateMenuDto
  ): Promise<DBService> {
    return this.repository.createMenu(salonId, categoryId, menuData);
  }

  async deleteMenu(menuId: string): Promise<void> {
    return this.repository.deleteMenu(menuId);
  }

  async updateMenu(menuId: string, updates: UpdateMenuDto): Promise<DBService> {
    return this.repository.updateMenu(menuId, updates);
  }

  async reorderMenus(
    salonId: string,
    menus: { id: string; display_order: number }[]
  ): Promise<void> {
    return this.repository.reorderMenus(salonId, menus);
  }
}
