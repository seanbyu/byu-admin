export interface Industry {
  id: string;
  name: string;
}

export interface SalonIndustry {
  id: string;
  name?: string;
  displayOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  industry_id?: string | null;
}

export interface SalonMenu {
  id: string;
  category_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  base_price?: number;
  pricing_type: string;
  description?: string;
  is_active: boolean;
  display_order?: number;
}

export interface IndustriesResponse {
  all: Industry[];
  selected: SalonIndustry[];
}
