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
  displayOrder: number;      // 예약 UI 표시 순서
  permissions: StaffPermission[];
  workHours?: BusinessHours[];
  workSchedule?: WorkSchedule; // DB 실제 구조
  holidays?: Holiday[];
  holidayEntries?: HolidayEntry[]; // DB 실제 구조
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;  // 퇴사 예정일 (soft delete)
  phone?: string;
  email?: string;
  role?: UserRole;
  positionId?: string;       // staff_positions 테이블 참조
  positionTitle?: string;    // 직급/호칭 (한국어) - 조회용
  positionTitle_en?: string; // 직급/호칭 (영어) - 조회용
  positionTitle_th?: string; // 직급/호칭 (태국어) - 조회용
}

export interface StaffPosition {
  id: string;
  salonId: string;
  name: string;      // 한국어 (기본)
  name_en?: string;  // 영어
  name_th?: string;  // 태국어
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePositionDto {
  name: string;      // 한국어 (기본)
  name_en?: string;  // 영어
  name_th?: string;  // 태국어
  rank: number;
}

export interface UpdatePositionDto {
  name?: string;      // 한국어 (기본)
  name_en?: string;   // 영어
  name_th?: string;   // 태국어
  rank?: number;
}
