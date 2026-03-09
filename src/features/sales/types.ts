export type SalesPreset = 'today' | 'week' | 'month' | 'custom';

export interface SalesFilters {
  preset: SalesPreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface SalesSummary {
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  bookingCount: number;
}

export interface SalesByPayment {
  method: string;
  label: string;
  amount: number;
  count: number;
}

export interface SalesByStaff {
  staffId: string;
  staffName: string;
  serviceAmount: number;
  productAmount: number;
  total: number;
  count: number;
}

export interface SalesByMenu {
  categoryName: string;
  amount: number;
  count: number;
}
