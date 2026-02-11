import type { CustomerListItem } from '../../../types';

// Tab Types
export type CustomerTab =
  | 'sales'
  | 'service'
  | 'product'
  | 'reservation'
  | 'membership'
  | 'cancellationFee';

// Staff item for select
export interface StaffSelectItem {
  id: string;
  name: string;
  positionTitle?: string;
}

// Form Data
export interface CustomerFormData {
  name: string;
  customer_number: string;
  phone: string;
  email: string;
  notes: string;
  customer_type: 'local' | 'foreign';
  primary_artist_id: string;
}

// Tab Content Props
export interface TabContentProps {
  customer: CustomerListItem;
}

// Modal Props
export interface EditCustomerModalProps {
  isOpen: boolean;
  customer: CustomerListItem | null;
  onClose: () => void;
}

// Customer Info Form Props
export interface CustomerInfoFormProps {
  customer: CustomerListItem;
  formData: CustomerFormData;
  isUpdating: boolean;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  staffList: StaffSelectItem[];
  isLoadingStaff: boolean;
  onFormDataChange: (data: Partial<CustomerFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onShowDeleteConfirm: (show: boolean) => void;
  onClose: () => void;
}
