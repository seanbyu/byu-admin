import { BaseRepository } from "./base.repository";

export class MenuRepository extends BaseRepository {
  // --- Industries ---
  async getIndustries(salonId: string) {
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

      const selected = data.map((item: any) => ({
        id: item.industry_id,
        name: item.industries?.name,
        displayOrder: item.display_order,
      }));

      return { all, selected };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async addSalonIndustry(salonId: string, industryId: string) {
    const { error } = await (
      this.supabase.from("salon_industries") as any
    ).insert({
      salon_id: salonId,
      industry_id: industryId,
    });
    if (error) throw new Error(error.message);
  }

  async removeSalonIndustry(salonId: string, industryId: string) {
    const { error } = await (this.supabase.from("salon_industries") as any)
      .delete()
      .eq("salon_id", salonId)
      .eq("industry_id", industryId);
    if (error) throw new Error(error.message);
  }

  async reorderIndustries(salonId: string, orderedIndustryIds: string[]) {
    const updates = orderedIndustryIds.map((industryId, index) =>
      (this.supabase.from("salon_industries") as any)
        .update({ display_order: index })
        .eq("salon_id", salonId)
        .eq("industry_id", industryId)
    );
    await Promise.all(updates);
  }

  // --- Categories ---
  async getCategories(salonId: string) {
    const { data, error } = await this.supabase
      .from("service_categories")
      .select("*")
      .eq("salon_id", salonId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
  }

  async createCategory(
    salonId: string,
    name: string,
    displayOrder: number,
    industryId?: string
  ) {
    const { data, error } = await (
      this.supabase.from("service_categories") as any
    )
      .insert({
        salon_id: salonId,
        name,
        display_order: displayOrder,
        industry_id: industryId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCategory(categoryId: string) {
    // 1. Delete all menus (services) in this category first
    const { error: menusError } = await (this.supabase.from("services") as any)
      .delete()
      .eq("category_id", categoryId);

    if (menusError) throw new Error(menusError.message);

    // 2. Delete the category
    const { error } = await (this.supabase.from("service_categories") as any)
      .delete()
      .eq("id", categoryId);

    if (error) throw new Error(error.message);
  }

  async updateCategory(
    categoryId: string,
    updates: {
      name?: string;
      displayOrder?: number;
      industryId?: string | null;
    }
  ) {
    const { data, error } = await (
      this.supabase.from("service_categories") as any
    )
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.displayOrder !== undefined && {
          display_order: updates.displayOrder,
        }),
        ...(updates.industryId !== undefined && {
          industry_id: updates.industryId,
        }),
      })
      .eq("id", categoryId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async reorderCategories(
    salonId: string,
    categories: { id: string; display_order: number }[]
  ) {
    const updates = categories.map((cat) =>
      (this.supabase.from("service_categories") as any)
        .update({ display_order: cat.display_order })
        .eq("id", cat.id)
        .eq("salon_id", salonId)
    );
    await Promise.all(updates);
  }

  // --- Menus (formerly Services) ---
  async getMenus(salonId: string, categoryId?: string) {
    let query = this.supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query.order("display_order");

    if (error) throw error;
    return data;
  }

  async createMenu(salonId: string, categoryId: string, menuData: any) {
    const { data, error } = await (this.supabase.from("services") as any)
      .insert({
        salon_id: salonId,
        category_id: categoryId,
        name: menuData.name,
        duration_minutes: menuData.duration,
        pricing_type: "FIXED",
        base_price: parseFloat(menuData.price) || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteMenu(menuId: string) {
    const { error } = await (this.supabase.from("services") as any)
      .delete()
      .eq("id", menuId);

    if (error) throw new Error(error.message);
  }

  async updateMenu(
    menuId: string,
    updates: { name?: string; price?: number; duration?: number }
  ) {
    const { data, error } = await (this.supabase.from("services") as any)
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.price && { base_price: updates.price }),
        ...(updates.duration && { duration_minutes: updates.duration }),
      })
      .eq("id", menuId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async reorderMenus(
    salonId: string,
    menus: { id: string; display_order: number }[]
  ) {
    const updates = menus.map((menu) =>
      (this.supabase.from("services") as any)
        .update({ display_order: menu.display_order })
        .eq("id", menu.id)
        .eq("salon_id", salonId)
    );
    await Promise.all(updates);
  }
}
