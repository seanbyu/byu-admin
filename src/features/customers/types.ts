// ============================================
// Customer Types
// ============================================

export type CustomerType = 'local' | 'foreign';

export type CustomerTag = 'VIP' | 'REGULAR' | 'NEW' | 'RETURNING' | 'DORMANT' | 'CHURNED';

export type CustomerSortBy = 'last_visit' | 'total_visits' | 'total_spent' | 'name' | 'created_at';

// Base filter types (기본 필터)
export type CustomerBaseFilterType = 'all' | 'new' | 'returning' | 'regular' | 'dormant' | 'vip';

// Artist filter type (담당자 필터) - 'artist:{artistId}' 형식
export type CustomerArtistFilterType = `artist:${string}`;

// Combined filter type
export type CustomerFilterType = CustomerBaseFilterType | CustomerArtistFilterType;

// Helper to check if filter is artist type
export const isArtistFilter = (filter: CustomerFilterType): filter is CustomerArtistFilterType => {
  return filter.startsWith('artist:');
};

// Helper to extract artist ID from filter
export const getArtistIdFromFilter = (filter: CustomerArtistFilterType): string => {
  return filter.replace('artist:', '');
};

// ============================================
// Customer Base Interface
// ============================================

export interface Customer {
  id: string;
  salon_id: string;
  user_id?: string; // Optional link to registered user

  // Basic info
  name: string;
  phone?: string;
  email?: string;
  notes?: string; // Customer chart memo
  customer_number?: string; // Custom customer number
  primary_artist_id?: string; // 담당자 ID

  // Visit tracking
  last_visit?: Date | string | null;
  total_visits: number;

  // Customer type
  customer_type: CustomerType;

  // Timestamps
  created_at: Date | string;
  updated_at: Date | string;
}

// ============================================
// Customer List Item (with computed fields)
// ============================================

export interface CustomerListItem extends Customer {
  // Computed fields from bookings
  total_spent: number;
  avg_visit_interval?: number; // in days

  // Primary artist (most frequent)
  primary_artist?: {
    id: string;
    name: string;
  };

  // Favorite service (most frequent)
  favorite_service?: {
    id: string;
    name: string;
  };

  // Tags
  tags: CustomerTag[];

  // Latest booking info
  latest_booking?: {
    id: string;
    booking_date: Date | string;
    service_name: string;
    artist_name: string;
  };
}

// ============================================
// Customer Chart (Detailed view)
// ============================================

export interface CustomerChart {
  customer: CustomerListItem;

  // Service history
  service_history: ServiceHistoryItem[];

  // Statistics
  stats: CustomerStats;

  // Notes history (if implemented)
  notes_history?: CustomerNote[];
}

export interface ServiceHistoryItem {
  id: string;
  booking_date: Date | string;
  start_time: string;

  // Service info
  service: {
    id: string;
    name: string;
    name_en?: string;
    name_th?: string;
  };

  // Artist info
  artist: {
    id: string;
    name: string;
  };

  // Notes
  customer_notes?: string; // What customer requested
  staff_notes?: string;    // Staff observations

  // Pricing
  total_price: number;

  // Status
  status: string;
}

export interface CustomerStats {
  total_visits: number;
  total_spent: number;
  avg_visit_interval: number; // Average days between visits
  avg_spending_per_visit: number;

  favorite_service?: {
    name: string;
    count: number;
  };

  favorite_artist?: {
    name: string;
    count: number;
  };

  first_visit_date?: Date | string;
  last_visit_date?: Date | string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  salon_id: string;
  booking_id?: string; // Optional link to booking

  type: 'GENERAL' | 'ALLERGY' | 'PREFERENCE' | 'WARNING' | 'SERVICE';
  content: string;

  created_by: {
    id: string;
    name: string;
  };

  is_important: boolean;

  created_at: Date | string;
  updated_at: Date | string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface GetCustomersParams {
  salon_id: string;
  filter?: CustomerFilterType;
  search?: string;
  sort_by?: CustomerSortBy;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GetCustomersResponse {
  data: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface GetCustomerChartParams {
  customer_id: string;
  salon_id: string;
}

export interface GetCustomerChartResponse {
  data: CustomerChart;
}

export interface CreateCustomerDto {
  salon_id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  customer_type?: CustomerType;
  customer_number?: string;
  primary_artist_id?: string;
  birth_date?: string; // YYYY-MM-DD format
  occupation?: string;
  group_ids?: string[];
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  customer_type?: CustomerType;
  customer_number?: string;
  primary_artist_id?: string;
}

// ============================================
// UI State Types
// ============================================

export interface CustomerPageState {
  // Filters
  activeFilter: CustomerFilterType;
  searchQuery: string;
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';

  // Pagination
  currentPage: number;
  pageSize: number;

  // Selected customers (for batch operations)
  selectedCustomerIds: string[];

  // Modals
  showChartModal: boolean;
  selectedCustomerId: string | null;

  // Actions
  setActiveFilter: (filter: CustomerFilterType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: CustomerSortBy) => void;
  toggleSortOrder: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleCustomerSelection: (customerId: string) => void;
  clearSelection: () => void;
  openChartModal: (customerId: string) => void;
  closeChartModal: () => void;
}

// ============================================
// Filter Helper Types
// ============================================

export interface CustomerFilterConfig {
  type: CustomerFilterType;
  label: string;
  count?: number;
  filterFn: (customer: CustomerListItem) => boolean;
}
