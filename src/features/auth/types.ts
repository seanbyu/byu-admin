import { User } from '@/types';
import { LANGUAGES } from './constants';

// ============================================
// Language
// ============================================

export type LangCode = (typeof LANGUAGES)[number]['code'];

export interface LanguageSelectModalProps {
  onClose: () => void;
}

// ============================================
// Login
// ============================================

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_FAILED'
  | 'LOGIN_ERROR'
  | 'SIGNUP_FAILED'
  | 'SIGNUP_ERROR'
  | 'SALON_PENDING_APPROVAL'
  | 'SALON_REJECTED'
  | 'STAFF_RESIGNED';

export interface AuthResponse {
  user: User | null;
  token: string | null;
  error?: string;
  errorCode?: AuthErrorCode;
}

export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ============================================
// Register
// ============================================

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  salonName: string;
  countryCode: string;
  phone: string;
  otp?: string;
  industryNames: string[];
}

export interface RegisterOwnerParams {
  email: string;
  password: string;
  name: string;
  salonName: string;
  phone: string;
  industryNames: string[];
  userId?: string;
}

export interface CheckDuplicateParams {
  type: 'email' | 'salonName';
  value: string;
}

export interface CheckDuplicateResponse {
  available: boolean;
  message?: string;
}

export type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string | 'STAFF' | 'MANAGER' | 'ADMIN';
}
