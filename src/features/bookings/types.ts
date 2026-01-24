import { BookingStatus } from '@/types';

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
  source: 'ONLINE' | 'PHONE' | 'WALK_IN';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
