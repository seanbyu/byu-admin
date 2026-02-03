// Settings Types

export interface StoreInfo {
  id: string;
  name: string;
  ownerName?: string;
  address: string;
  googleMapUrl?: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
  description?: string;
  instagramUrl?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxStaff: number;
  maxMenus: number | null; // null = unlimited
  features: string[];
  isCurrent?: boolean;
}

export interface Subscription {
  planId: string;
  planName: string;
  price: number;
  nextBillingDate: string;
  status: 'active' | 'cancelled' | 'expired';
}

export interface AccountInfo {
  id: string;
  username: string;
  name: string;
  phone: string;
  email?: string;
}

export type SettingsTab = 'store' | 'plan' | 'account';

export interface AccountFormSectionProps {
  accountInfo: AccountInfo | null;
  isUpdating: boolean;
  isSendingCode: boolean;
  isVerificationSent: boolean;
  isVerifying: boolean;
  isPhoneVerified: boolean;
  onSave: (data: Partial<AccountInfo>) => Promise<void>;
  onSendVerificationCode: (phone: string) => Promise<void>;
  onVerifyCode: (phone: string, code: string) => Promise<void>;
  onVerificationSentChange: (sent: boolean) => void;
  onPhoneVerifiedChange: (verified: boolean) => void;
}

export interface PasswordChangeSectionProps {
  isChangingPassword: boolean;
  onChangePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

export interface AccountTabProps {
  accountInfo: AccountInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  isChangingPassword: boolean;
  isSendingCode: boolean;
  isVerificationSent: boolean;
  isVerifying: boolean;
  isPhoneVerified: boolean;
  onSave: (data: Partial<AccountInfo>) => Promise<void>;
  onChangePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  onSendVerificationCode: (phone: string) => Promise<void>;
  onVerifyCode: (phone: string, code: string) => Promise<void>;
  onVerificationSentChange: (sent: boolean) => void;
  onPhoneVerifiedChange: (verified: boolean) => void;
}
