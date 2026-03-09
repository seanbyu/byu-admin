import { BaseRepository } from "./base.repository";
import {
  DBIndustry,
  DBServiceCategory,
  DBService,
  DBSalonIndustry,
  CreateMenuDto,
  UpdateMenuDto,
  UpdateCategoryDto,
  IndustriesResponse,
  IndustryItem,
} from "../types";

export class MenuRepository extends BaseRepository {
  // --- Industries ---
  async getIndustries(salonId: string): Promise<IndustriesResponse> {
    const { data: all, error: allError } = await this.supabase
      .from("industries")
      .select("*")
      .order("name");

    if (allError) throw new Error(allError.message);

    try {
      // Try to fetch with display_order
      const { data, error } = await this.supabase
        .from("salon_industries")
        .select(
          `
        industry_id,
        display_order,
        industries (
          id,
          name
        )
      `
        )
        .eq("salon_id", salonId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const selected: IndustryItem[] = (data || []).map((item) => ({
        id: item.industry_id ?? "",
        name: item.industries?.name || "",
        displayOrder: item.display_order,
      }));

      return { all: all as DBIndustry[] | null, selected };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(errorMessage);
    }
  }

  async addSalonIndustry(salonId: string, industryId: string): Promise<void> {
    const { error } = await this.supabase
      .from("salon_industries")
      .insert({
        salon_id: salonId,
        industry_id: industryId,
      } as never);
    if (error) throw new Error(error.message);
  }

  async removeSalonIndustry(salonId: string, industryId: string): Promise<void> {
    const { error } = await this.supabase
      .from("salon_industries")
      .delete()
      .eq("salon_id", salonId)
      .eq("industry_id", industryId);
    if (error) throw new Error(error.message);
  }

  async reorderIndustries(salonId: string, orderedIndustryIds: string[]): Promise<void> {
    const updates = orderedIndustryIds.map((industryId, index) =>
      this.supabase
        .from("salon_industries")
        .update({ display_order: index } as never)
        .eq("salon_id", salonId)
        .eq("industry_id", industryId)
    );
    await Promise.all(updates);
  }

  // --- Categories ---
  async getCategories(salonId: string): Promise<DBServiceCategory[]> {
    const { data, error } = await this.supabase
      .from("service_categories")
      .select("*")
      .eq("salon_id", salonId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return (data || []) as DBServiceCategory[];
  }

  async createCategory(
    salonId: string,
    name: string,
    displayOrder: number,
    industryId?: string
  ): Promise<DBServiceCategory> {
    const { data, error } = await this.supabase
      .from("service_categories")
      .insert({
        salon_id: salonId,
        name,
        display_order: displayOrder,
        industry_id: industryId,
      } as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DBServiceCategory;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    // 1. Delete all menus (services) in this category first
    const { error: menusError } = await this.supabase
      .from("services")
      .delete()
      .eq("category_id", categoryId);

    if (menusError) throw new Error(menusError.message);

    // 2. Delete the category
    const { error } = await this.supabase
      .from("service_categories")
      .delete()
      .eq("id", categoryId);

    if (error) throw new Error(error.message);
  }

  async updateCategory(
    categoryId: string,
    updates: UpdateCategoryDto
  ): Promise<DBServiceCategory> {
    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;
    if (updates.industryId !== undefined) updateData.industry_id = updates.industryId;

    const { data, error } = await this.supabase
      .from("service_categories")
      .update(updateData as never)
      .eq("id", categoryId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DBServiceCategory;
  }

  async reorderCategories(
    salonId: string,
    categories: { id: string; display_order: number }[]
  ): Promise<void> {
    const updates = categories.map((cat) =>
      this.supabase
        .from("service_categories")
        .update({ display_order: cat.display_order } as never)
        .eq("id", cat.id)
        .eq("salon_id", salonId)
    );
    await Promise.all(updates);
  }

  // --- Menus (formerly Services) ---
  async getMenus(salonId: string, categoryId?: string): Promise<DBService[]> {
    let query = this.supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query.order("display_order");

    if (error) throw error;
    return (data || []) as DBService[];
  }

  async createMenu(
    salonId: string,
    categoryId: string,
    menuData: CreateMenuDto
  ): Promise<DBService> {
    const { data, error } = await this.supabase
      .from("services")
      .insert({
        salon_id: salonId,
        category_id: categoryId,
        name: menuData.name,
        duration_minutes: menuData.duration,
        pricing_type: "FIXED",
        base_price: menuData.price,
        display_order: menuData.displayOrder ?? 0,
      } as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DBService;
  }

  async deleteMenu(menuId: string): Promise<void> {
    const { error } = await this.supabase
      .from("services")
      .delete()
      .eq("id", menuId);

    if (error) throw new Error(error.message);
  }

  async updateMenu(menuId: string, updates: UpdateMenuDto): Promise<DBService> {
    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.base_price = updates.price;
    if (updates.duration !== undefined) updateData.duration_minutes = updates.duration;
    if (updates.description !== undefined) updateData.description = updates.description;

    const { data, error } = await this.supabase
      .from("services")
      .update(updateData as never)
      .eq("id", menuId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DBService;
  }

  async reorderMenus(
    salonId: string,
    menus: { id: string; display_order: number }[]
  ): Promise<void> {
    const updates = menus.map((menu) =>
      this.supabase
        .from("services")
        .update({ display_order: menu.display_order } as never)
        .eq("id", menu.id)
        .eq("salon_id", salonId)
    );
    await Promise.all(updates);
  }
}
