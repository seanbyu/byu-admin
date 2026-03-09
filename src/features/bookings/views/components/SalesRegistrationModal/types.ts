import { Booking, DiscountType } from '../../../types';

export type { PaymentMethod, DiscountType } from '../../../types';
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
