import { BookingStatus } from '@/types';

// ============================================
// Customer
// ============================================

export type CustomerType = 'local' | 'foreign';

export interface ExistingCustomer {
  id: string;
  name: string;
  phone: string;
}

// ============================================
// Service
// ============================================

export interface ServiceInfo {
  id: string;
  name: string;
  category_id: string;
  duration_minutes?: number;
  base_price?: number;
  price?: number;
}

// ============================================
// Sales
// ============================================

export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER' | '';
export type DiscountType = 'percent' | 'fixed';

// ============================================
// UI
// ============================================

export interface ArtistOption {
  value: string;
  label: string;
}

// ============================================
// Products
// ============================================

export interface SalonProduct {
  id: string;
  salonId: string;
  name: string;
  nameEn?: string;
  nameTh?: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  salonId: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price: number;
  source: 'ONLINE' | 'PHONE' | 'WALK_IN';
  notes?: string;
  // 결제
  paymentMethod?: string;
  // 제품 관련
  productId?: string;
  productName?: string;
  productAmount: number;
  // 점포 판매 (소매)
  storeSalesAmount: number;
  // 메타데이터 (복수 서비스 등)
  bookingMeta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
