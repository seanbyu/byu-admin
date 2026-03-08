import React from 'react';
import { Booking } from '../../../types';
import { BusinessHours } from '@/types';

export type CustomerType = 'local' | 'foreign';

export interface ExistingCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  category_id: string;
  duration_minutes?: number;
  base_price?: number;
  price?: number;
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
  artists: Array<{ value: string; label: string }>;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  onStaffChange: (staffId: string) => void;
  onServiceChange: (serviceId: string) => void;
  editBooking?: Booking;
}

// useBookingForm
export interface UseBookingFormProps {
  editBooking?: Booking;
  selectedDate: Date;
  selectedTime: string;
  selectedStaffId: string;
  selectedServiceId: string;
  isEditMode: boolean;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  onStaffChange: (staffId: string) => void;
  onServiceChange: (serviceId: string) => void;
}

export interface UseBookingFormReturn {
  // Form state
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  notes: string;
  errors: Record<string, string>;
  // Internal state (for edit mode)
  internalDate: Date;
  internalTime: string;
  internalStaffId: string;
  internalServiceId: string;
  // Computed values (use these in components)
  currentDate: Date;
  currentTime: string;
  currentStaffId: string;
  currentServiceId: string;
  // Setters
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerType: (type: CustomerType) => void;
  setNotes: (notes: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  // Handlers
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setDate: (date: Date) => void;
  handleTimeChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setTime: (time: string) => void;
  handleStaffChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleServiceChange: (serviceId: string) => void;
  // Actions
  resetForm: () => void;
  validateForm: () => boolean;
  initializeEditForm: (booking: Booking) => void;
}

// useBookingSave
export interface UseBookingSaveProps {
  salonId: string;
  editBooking?: Booking;
  isEditMode: boolean;
  // Form values
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  notes: string;
  // Current values
  currentDate: Date;
  currentTime: string;
  currentStaffId: string;
  selectedStaffName: string;
  // Service info
  selectedServices: ServiceInfo[];
  categoryMap: Record<string, string>;
  // Callbacks
  onClose: () => void;
  validateForm: () => boolean;
  // Customer
  selectedCustomer: ExistingCustomer | null;
}

export interface UseBookingSaveReturn {
  isCreating: boolean;
  isUpdating: boolean;
  isCreatingCustomer: boolean;
  showNewCustomerConfirm: boolean;
  setShowNewCustomerConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleConfirmNewCustomer: () => Promise<void>;
}

// useCustomerSearch
export interface UseCustomerSearchProps {
  customerPhone: string;
  customers: any[] | undefined;
  onPhoneChange: (phone: string) => void;
  onNameChange: (name: string) => void;
}

export interface UseCustomerSearchReturn {
  selectedCustomer: ExistingCustomer | null;
  showCustomerDropdown: boolean;
  matchingCustomers: ExistingCustomer[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleSelectCustomer: (customer: any) => void;
  handleClearCustomer: () => void;
  handlePhoneChange: (value: string) => void;
  handlePhoneFocus: () => void;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<ExistingCustomer | null>>;
  setShowCustomerDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}
