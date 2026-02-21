import { Booking } from '../../../types';
import { BusinessHours } from '@/types';

export type CustomerType = 'local' | 'foreign';

export interface ExistingCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  slotDuration: number;
  businessHours: BusinessHours[];
  selectedStaffId: string;
  selectedServiceId: string;
  designers: Array<{ value: string; label: string }>;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  onStaffChange: (staffId: string) => void;
  onServiceChange: (serviceId: string) => void;
  editBooking?: Booking;
}

export interface BookingFormState {
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  notes: string;
  errors: Record<string, string>;
}

export interface BookingFormActions {
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerType: (type: CustomerType) => void;
  setNotes: (notes: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  resetForm: () => void;
  validateForm: () => boolean;
}

export interface CustomerSearchState {
  selectedCustomer: ExistingCustomer | null;
  showCustomerDropdown: boolean;
  matchingCustomers: ExistingCustomer[];
}

export interface CustomerSearchActions {
  handleSelectCustomer: (customer: ExistingCustomer) => void;
  handleClearCustomer: () => void;
  handlePhoneChange: (value: string) => void;
  handlePhoneFocus: () => void;
  setShowCustomerDropdown: (show: boolean) => void;
}
