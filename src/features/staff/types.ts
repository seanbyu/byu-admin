import { UserRole } from '@/types';

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
  createdAt: Date;
  updatedAt: Date;
  phone?: string;
  email?: string;
  role?: UserRole;
}
