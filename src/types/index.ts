export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

// 언어 타입
export type Locale = 'ko' | 'en' | 'th';

// 서비스 타입 (DB service_categories 참조)
// export enum ServiceType { ... } // Removed
// 살롱 카테고리 (DB industries 참조)
// export enum SalonCategory { ... } // Removed

// 예약 상태
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

// 사용자 인터페이스
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  salonId?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  permissions?: StaffPermission[];
}

// 살롱 인터페이스
export interface Salon {
  id: string;
  name: string;
  category: string; // industry_id or name from industries table
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  businessHours: BusinessHours[];
  images: string[];
  instagramUrl?: string;
  isWifiAvailable: boolean;
  isParkingAvailable: boolean;
  isApproved: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 영업시간
export interface BusinessHours {
  dayOfWeek: number; // 0: 일요일, 1: 월요일, ..., 6: 토요일
  openTime: string; // "09:00"
  closeTime: string; // "20:00"
  isOpen: boolean;
}

// 직원(Staff) 인터페이스
export interface Staff {
  id: string;
  userId: string;
  salonId: string;
  name: string;
  description: string;
  experience: number; // 경력 (년)
  profileImage?: string;
  portfolioImages: string[];
  specialties: string[]; // service_category_ids
  rating: number;
  reviewCount: number;
  isActive: boolean;
  permissions: StaffPermission[];
  createdAt: Date;
  updatedAt: Date;
  // Extended fields from User
  phone?: string;
  email?: string;
  role?: UserRole;
}

// 직원 권한
export interface StaffPermission {
  module: string; // 'bookings', 'customers', 'reviews', 'sales'
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

// 서비스 인터페이스
export interface Service {
  id: string;
  salonId: string;
  categoryId: string; // references service_categories(id)
  name: string;
  description: string;
  price: number;
  duration: number; // 분
  isActive: boolean;
}

// 예약 인터페이스
export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  salonId: string;
  staffId: string;
  serviceId: string;
  serviceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price: number;
  notes?: string;
  source: 'ONLINE' | 'PHONE' | 'WALK_IN'; // 예약 출처
  createdAt: Date;
  updatedAt: Date;
}

// 고객 인터페이스
export interface Customer {
  id: string;
  customerNumber: string; // 자동 생성된 고객 번호
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  lastVisit?: Date;
  totalVisits: number;
  salonId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 리뷰 인터페이스
export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  salonId: string;
  staffId: string;
  bookingId: string;
  rating: number; // 1-5
  comment: string;
  images: string[];
  response?: ReviewResponse;
  createdAt: Date;
  updatedAt: Date;
}

// 리뷰 응답
export interface ReviewResponse {
  responderId: string;
  responderName: string;
  responderRole: 'MANAGER' | 'STAFF' | 'ADMIN';
  comment: string;
  createdAt: Date;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  images?: string[];
  isRead: boolean;
  createdAt: Date;
}

// 채팅방
export interface ChatRoom {
  id: string;
  customerId: string;
  customerName: string;
  salonId: string;
  salonName: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 매출 통계
export interface SalesStats {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalBookings: number;
  byService: ServiceSales[];
  byStaff?: StaffSales[];
}

export interface ServiceSales {
  categoryId: string;
  categoryName: string;
  serviceName: string;
  count: number;
  revenue: number;
}

export interface StaffSales {
  staffId: string;
  staffName: string;
  totalRevenue: number;
  totalBookings: number;
  byService: ServiceSales[];
}

// 알림
export interface Notification {
  id: string;
  userId: string;
  type:
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_REMINDER'
    | 'REVIEW_NEW'
    | 'CHAT_NEW';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// 페이지네이션
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API 응답
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
