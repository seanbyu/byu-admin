import { UserRole, BusinessHours, Holiday } from '@/types';

export interface StaffPermission {
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface StaffSocialLinks {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  facebook?: string;
}

// DB 호환 타입: salon-store-web의 WorkSchedule과 동일
export type WorkScheduleDayEntry = {
  enabled: boolean;
  start: string | null;
  end: string | null;
};

export type WorkSchedule = {
  [dayName: string]: WorkScheduleDayEntry;
};

// DB 호환 타입: salon-store-web의 HolidayEntry와 동일
export type HolidayEntry =
  | string
  | {
      date: string;
      reason?: string;
    };

export interface Staff {
  id: string;
  userId: string;
  salonId: string;
  name: string;
  description: string;
  experience: number;
  profileImage?: string;
  portfolioImages: string[];
  specialties: string[];
  socialLinks?: StaffSocialLinks;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isBookingEnabled: boolean;
  permissions: StaffPermission[];
  workHours?: BusinessHours[];
  workSchedule?: WorkSchedule; // DB 실제 구조
  holidays?: Holiday[];
  holidayEntries?: HolidayEntry[]; // DB 실제 구조
  createdAt: Date;
  updatedAt: Date;
  phone?: string;
  email?: string;
  role?: UserRole;
  positionTitle?: string; // 직급/호칭 (simple text)
}

export interface StaffPosition {
  id: string;
  salonId: string;
  name: string;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePositionDto {
  name: string;
  rank: number;
}

export interface UpdatePositionDto {
  name?: string;
  rank?: number;
}
