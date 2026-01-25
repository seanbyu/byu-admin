'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { createStaff } from '@/actions/staff';
import { Eye, EyeOff } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salonId: string;
  currentStaffCount: number;
}

export default function CreateStaffModal({
  isOpen,
  onClose,
  onSuccess,
  salonId,
  currentStaffCount,
}: CreateStaffModalProps) {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const MAX_FREE_STAFF = 5;
  const isLimitReached = currentStaffCount >= MAX_FREE_STAFF;

  // 이메일 형식 검증
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!value) {
      setEmailError(t('staff.validation.emailRequired'));
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError(t('staff.validation.emailInvalid'));
      return false;
    }
    setEmailError(null);
    return true;
  };

  // 비밀번호 형식 검증 (영문+숫자+특수문자 8~20자)
  const validatePassword = (value: string): boolean => {
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isValidLength = value.length >= 8 && value.length <= 20;

    if (!value) {
      setPasswordError(t('staff.validation.passwordRequired'));
      return false;
    }
    if (!isValidLength) {
      setPasswordError(t('staff.validation.passwordLength'));
      return false;
    }
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setPasswordError(t('staff.validation.passwordPattern'));
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(t('staff.validation.loginRequired'));
      }

      const result = await createStaff({
        salonId,
        email,
        name,
        role,
        password,
        accessToken: session.access_token,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setRole('STAFF');
      setPassword('');
      setEmailError(null);
      setPasswordError(null);
    } catch (err: any) {
      if (
        err.message?.includes('User from sub claim') ||
        err.message?.toLowerCase().includes('unauthorized')
      ) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('staff.createModal.title')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
          <p className="font-semibold">
            {t('staff.createModal.currentCount')}: {currentStaffCount} / {MAX_FREE_STAFF}
          </p>
          {isLimitReached ? (
            <p className="text-red-600 mt-1">
              {t('staff.createModal.limitReached')}
            </p>
          ) : (
            <p className="mt-1">
              {t('staff.createModal.description')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            {t('staff.createModal.email')}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="example@email.com"
            disabled={isLimitReached}
          />
          {emailError && (
            <p className="text-sm text-red-500">{emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            {t('staff.createModal.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${
                passwordError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('staff.createModal.passwordPlaceholder')}
              disabled={isLimitReached}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError ? (
            <p className="text-sm text-red-500">{passwordError}</p>
          ) : (
            <p className="text-xs text-gray-500">
              {t('staff.createModal.passwordHint')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            {t('staff.createModal.name')}
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('staff.createModal.namePlaceholder')}
            disabled={isLimitReached}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            {t('staff.createModal.role')}
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLimitReached}
          >
            <option value="STAFF">{t('staff.createModal.roleStaff')}</option>
            <option value="MANAGER">{t('staff.createModal.roleManager')}</option>
            <option value="ADMIN">{t('staff.createModal.roleAdmin')}</option>
          </select>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || isLimitReached}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.creating') : t('staff.createModal.createAccount')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
