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
