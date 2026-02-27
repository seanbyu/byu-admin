'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Check, X } from 'lucide-react';

// 비밀번호 검증 규칙
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 20,
  letterRegex: /[a-zA-Z]/,
  numberRegex: /[0-9]/,
  specialRegex: /[!@#$%^&*(),.?":{}|<>]/,
} as const;

interface PasswordValidation {
  isValidLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
  showValidationRules?: boolean;
  className?: string;
}

interface PasswordConfirmInputProps {
  password: string;
  confirmPassword: string;
  onConfirmChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// 비밀번호 검증 함수
export function validatePassword(password: string): PasswordValidation {
  const isValidLength =
    password.length >= PASSWORD_RULES.minLength &&
    password.length <= PASSWORD_RULES.maxLength;
  const hasLetter = PASSWORD_RULES.letterRegex.test(password);
  const hasNumber = PASSWORD_RULES.numberRegex.test(password);
  const hasSpecial = PASSWORD_RULES.specialRegex.test(password);
  const isValid = isValidLength && hasLetter && hasNumber && hasSpecial;

  return { isValidLength, hasLetter, hasNumber, hasSpecial, isValid };
}

// 검증 규칙 표시 컴포넌트
function ValidationRule({
  isValid,
  isEmpty,
  label,
}: {
  isValid: boolean;
  isEmpty: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${
        isEmpty ? 'text-secondary-400' : isValid ? 'text-success-600' : 'text-error-500'
      }`}
    >
      {isEmpty ? (
        <div className="w-3 h-3 rounded-full border border-secondary-300" />
      ) : isValid ? (
        <Check size={12} className="text-success-600" />
      ) : (
        <X size={12} className="text-error-500" />
      )}
      <span>{label}</span>
    </div>
  );
}

// 비밀번호 입력 컴포넌트
export function PasswordInput({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  error,
  showValidationRules = true,
  className = '',
}: PasswordInputProps) {
  const t = useTranslations('common');
  const [showPassword, setShowPassword] = useState(false);

  const validation = useMemo(() => validatePassword(value), [value]);
  const isEmpty = !value;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder || t('password.placeholder')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${
            error
              ? 'border-error-500'
              : !isEmpty && validation.isValid
                ? 'border-success-500'
                : 'border-secondary-300'
          }`}
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-500 hover:text-secondary-700"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && <p className="text-sm text-error-500">{error}</p>}

      {showValidationRules && (
        <div className="space-y-1 mt-2">
          <ValidationRule
            isEmpty={isEmpty}
            isValid={validation.isValidLength}
            label={t('password.lengthRule')}
          />
          <ValidationRule
            isEmpty={isEmpty}
            isValid={validation.hasLetter}
            label={t('password.letterRule')}
          />
          <ValidationRule
            isEmpty={isEmpty}
            isValid={validation.hasNumber}
            label={t('password.numberRule')}
          />
          <ValidationRule
            isEmpty={isEmpty}
            isValid={validation.hasSpecial}
            label={t('password.specialRule')}
          />
        </div>
      )}
    </div>
  );
}

// 비밀번호 확인 입력 컴포넌트
export function PasswordConfirmInput({
  password,
  confirmPassword,
  onConfirmChange,
  label,
  placeholder,
  disabled = false,
  className = '',
}: PasswordConfirmInputProps) {
  const t = useTranslations('common');
  const [showPassword, setShowPassword] = useState(false);

  const isMatch = confirmPassword === password;
  const isEmpty = !confirmPassword;
  const showSuccess = !isEmpty && isMatch;
  const showError = !isEmpty && !isMatch;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onConfirmChange(e.target.value);
    },
    [onConfirmChange]
  );

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder || t('password.confirmPlaceholder')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${
            showError
              ? 'border-error-500'
              : showSuccess
                ? 'border-success-500'
                : 'border-secondary-300'
          }`}
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-500 hover:text-secondary-700"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showError && (
        <p className="text-sm text-error-500">{t('password.mismatch')}</p>
      )}
      {showSuccess && (
        <p className="text-sm text-success-600">{t('password.match')}</p>
      )}
    </div>
  );
}

// 통합 컴포넌트: 비밀번호 + 확인 입력
interface PasswordWithConfirmProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  passwordLabel?: string;
  confirmLabel?: string;
  passwordPlaceholder?: string;
  confirmPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PasswordWithConfirm({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
  passwordLabel,
  confirmLabel,
  passwordPlaceholder,
  confirmPlaceholder,
  disabled = false,
  className = '',
}: PasswordWithConfirmProps) {
  const t = useTranslations('common');

  return (
    <div className={`space-y-4 ${className}`}>
      <PasswordInput
        value={password}
        onChange={onPasswordChange}
        label={passwordLabel || t('password.label')}
        placeholder={passwordPlaceholder}
        disabled={disabled}
        showValidationRules={true}
      />
      <PasswordConfirmInput
        password={password}
        confirmPassword={confirmPassword}
        onConfirmChange={onConfirmChange}
        label={confirmLabel || t('password.confirmLabel')}
        placeholder={confirmPlaceholder}
        disabled={disabled}
      />
    </div>
  );
}

export default PasswordInput;
