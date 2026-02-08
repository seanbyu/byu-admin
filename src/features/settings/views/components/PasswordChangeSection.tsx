'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  PasswordInput,
  PasswordConfirmInput,
  validatePassword,
} from '@/components/ui/PasswordInput';
import { PasswordChangeSectionProps } from '../../types';

export const PasswordChangeSection = memo(function PasswordChangeSection({
  isChangingPassword,
  onChangePassword,
}: PasswordChangeSectionProps) {
  const t = useTranslations();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [error, setError] = useState('');

  // 새 비밀번호 유효성 검사
  const validation = useMemo(() => validatePassword(newPassword), [newPassword]);
  const isPasswordMatch = newPassword === confirmPassword && confirmPassword !== '';

  // 제출 버튼 활성화 조건
  const isDisabled =
    !currentPassword ||
    !newPassword ||
    !confirmPassword ||
    !validation.isValid ||
    !isPasswordMatch;

  const handleSubmit = useCallback(async () => {
    if (!validation.isValid) {
      setError(t('common.password.invalid'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('common.password.mismatch'));
      return;
    }

    try {
      await onChangePassword({
        currentPassword,
        newPassword,
      });

      // 성공 시 폼 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch {
      setError(t('settings.account.changePasswordFailed'));
    }
  }, [currentPassword, newPassword, confirmPassword, validation.isValid, onChangePassword, t]);

  return (
    <Card
      title={t('settings.account.changePassword')}
      padding="sm"
      className="sm:p-6"
    >
      <div className="space-y-4">
        {/* 현재 비밀번호 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('settings.account.currentPassword')}
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setError('');
              }}
              placeholder={t('settings.account.currentPasswordPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* 새 비밀번호 (유효성 검사 포함) */}
        <PasswordInput
          value={newPassword}
          onChange={(value) => {
            setNewPassword(value);
            setError('');
          }}
          label={t('settings.account.newPassword')}
          placeholder={t('settings.account.newPasswordPlaceholder')}
          showValidationRules={true}
        />

        {/* 비밀번호 확인 */}
        <PasswordConfirmInput
          password={newPassword}
          confirmPassword={confirmPassword}
          onConfirmChange={(value) => {
            setConfirmPassword(value);
            setError('');
          }}
          label={t('settings.account.confirmPassword')}
          placeholder={t('settings.account.confirmPasswordPlaceholder')}
        />

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          isLoading={isChangingPassword}
          disabled={isDisabled}
          className="w-full sm:w-auto"
        >
          {t('settings.account.updatePassword')}
        </Button>
      </div>
    </Card>
  );
});
