import { Booking } from '../../../types';

export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER' | '';
export type DiscountType = 'percent' | 'fixed';
export type SalesTab = 'service' | 'product';

export interface CategoryPriceItem {
  categoryId: string;
  categoryName: string;
  price: string;
  showDiscount: boolean;
  discountType: DiscountType;
  discountValue: string;
}

export interface SalesRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSave: (id: string, updates: Partial<Booking>) => void;
}
