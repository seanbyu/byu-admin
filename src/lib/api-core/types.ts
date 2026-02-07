import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";
import { UserRole, BusinessHours, Holiday, StaffPermission } from "@/types";

// ============================================
// Supabase Client Type
// ============================================
export type Client = SupabaseClient<Database>;

// ============================================
// DB Schema Types (snake_case - matches database columns)
// ============================================

// User table row
export interface DBUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole | string;
  salon_id: string | null;
  profile_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Staff profile table row
export interface DBStaffProfile {
  user_id: string;
  bio: string | null;
  years_of_experience: number | null;
  specialties: string[] | null;
  social_links: DBSocialLinks | null;
  permissions: DBPermissions | null;
  is_booking_enabled: boolean | null;
  work_schedule: DBWorkSchedule | null;
  holidays: Holiday[] | null;
  position_id: string | null; // staff_positions 참조
}

// Work schedule in DB format (JSONB)
export interface DBWorkSchedule {
  sunday?: DBDaySchedule;
  monday?: DBDaySchedule;
  tuesday?: DBDaySchedule;
  wednesday?: DBDaySchedule;
  thursday?: DBDaySchedule;
  friday?: DBDaySchedule;
  saturday?: DBDaySchedule;
}

export interface DBDaySchedule {
  enabled: boolean;
  start: string | null;
  end: string | null;
}

// Social links in DB format (JSONB)
export interface DBSocialLinks {
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  website?: string | null;
}

// Permissions in DB format (JSONB)
export interface DBPermissions {
  [module: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

// User with joined staff_profiles
export interface DBUserWithProfile extends DBUser {
  staff_profiles: DBStaffProfile | DBStaffProfile[] | null;
}

// ============================================
// Booking DB Types
// ============================================
export interface DBBooking {
  id: string;
  salon_id: string;
  customer_id: string;
  customer_user_type: string;
  artist_id: string;
  artist_user_type: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  service_price: number;
  additional_charges: number;
  discount: number;
  total_price: number;
  payment_status: string;
  payment_method: string | null;
  paid_at: string | null;
  customer_notes: string | null;
  staff_notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBBookingWithRelations extends DBBooking {
  customer: { id: string; name: string; phone: string | null } | null;
  artist: { id: string; name: string } | null;
  service: { id: string; name: string; base_price: number } | null;
}

// ============================================
// Customer DB Types
// ============================================
export interface DBCustomer {
  id: string;
  salon_id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  last_visit: string | null;
  total_visits: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Menu/Service DB Types
// ============================================
export interface DBServiceCategory {
  id: string;
  salon_id: string;
  industry_id: string | null;
  name: string;
  display_order: number;
  created_at: string;
}

export interface DBService {
  id: string;
  salon_id: string;
  category_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  pricing_type: string;
  base_price: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBIndustry {
  id: string;
  name: string;
  created_at: string;
}

export interface DBSalonIndustry {
  industry_id: string;
  display_order: number | null;
  industries: DBIndustry | null;
}

// ============================================
// DTO Types (Data Transfer Objects for API input)
// ============================================

// Staff update DTO
export interface UpdateStaffDto {
  // User fields
  name?: string;
  phone?: string;
  profileImage?: string;
  isActive?: boolean;
  password?: string;

  // Profile fields
  description?: string;
  experience?: number;
  specialties?: string[];
  socialLinks?: Partial<DBSocialLinks>;
  isBookingEnabled?: boolean;
  permissions?: StaffPermission[] | DBPermissions;
  workHours?: BusinessHours[];
  holidays?: Holiday[];
  positionId?: string | null; // staff_positions 참조
}

// Booking create DTO
export interface CreateBookingDto {
  salon_id: string;
  customer_id: string;
  artist_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  service_price: number;
  total_price: number;
  customer_notes?: string;
}

// Booking update DTO
export interface UpdateBookingDto {
  artist_id?: string;
  service_id?: string;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  total_price?: number;
  customer_notes?: string | null;
  status?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  staff_notes?: string;
  payment_status?: string;
  payment_method?: string;
  paid_at?: string;
}

// Customer create DTO
export interface CreateCustomerDto {
  salon_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

// Customer update DTO
export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  last_visit?: string;
  total_visits?: number;
}

// Menu create DTO
export interface CreateMenuDto {
  name: string;
  price: number;
  duration: number;
  description?: string;
  displayOrder?: number;
}

// Menu update DTO
export interface UpdateMenuDto {
  name?: string;
  price?: number;
  duration?: number;
  description?: string;
}

// Category update DTO
export interface UpdateCategoryDto {
  name?: string;
  displayOrder?: number;
  industryId?: string | null;
}

// Auth DTOs
export interface RegisterOwnerDto {
  email: string;
  password: string;
  name: string;
  phone: string;
  salonName: string;
  industryId?: string;
}

export interface DuplicateCheckResult {
  available: boolean;
  message?: string;
}

export interface RegisterOwnerResult {
  success: boolean;
  userId?: string;
  salonId?: string;
  message?: string;
}

// ============================================
// Response Types (Frontend format - camelCase)
// ============================================

// Staff response (transformed from DB)
export interface StaffResponse {
  id: string;
  userId: string;
  salonId: string;
  name: string;
  description: string;
  experience: number;
  profileImage: string | null;
  portfolioImages: string[];
  specialties: string[];
  socialLinks: Partial<DBSocialLinks>;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isBookingEnabled: boolean;
  permissions: StaffPermission[];
  workHours: BusinessHours[];
  holidays: Holiday[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;        // 퇴사 예정일 (soft delete)
  phone: string | null;
  email: string;
  role: string;
  positionId: string | null;       // staff_positions 참조
  positionTitle: string | null;    // 직급/호칭 (한국어) - 조회용
  positionTitle_en: string | null; // 직급/호칭 (영어) - 조회용
  positionTitle_th: string | null; // 직급/호칭 (태국어) - 조회용
}

// Booking response (transformed from DB)
export interface BookingResponse {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  salonId: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Industry Response Types
// ============================================
export interface IndustryItem {
  id: string;
  name: string;
  displayOrder?: number | null;
}

export interface IndustriesResponse {
  all: DBIndustry[] | null;
  selected: IndustryItem[];
}

// ============================================
// Utility Types
// ============================================

// Day name mapping
export type DayName = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const DAY_NAMES: DayName[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DAY_MAP: Record<DayName, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};
