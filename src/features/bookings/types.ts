import { BookingStatus } from '@/types';

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
  date: Date;
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
  createdAt: Date;
  updatedAt: Date;
}
