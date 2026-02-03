'use client';

import { useState, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordChangeSectionProps } from '../../types';

export const PasswordChangeSection = memo(function PasswordChangeSection({
  isChangingPassword,
  onChangePassword,
}: PasswordChangeSectionProps) {
  const t = useTranslations();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = useCallback((field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('settings.account.passwordMismatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError(t('settings.account.passwordTooShort'));
      return;
    }

    await onChangePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    // Reset form on success
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [passwordData, onChangePassword, t]);

  const isDisabled =
    !passwordData.currentPassword ||
    !passwordData.newPassword ||
    !passwordData.confirmPassword;

  return (
    <Card
      title={t('settings.account.changePassword')}
      padding="sm"
      className="sm:p-6"
    >
      <div className="space-y-3 sm:space-y-4">
        <Input
          label={t('settings.account.currentPassword')}
          type="password"
          value={passwordData.currentPassword}
          onChange={(e) =>
            handlePasswordChange('currentPassword', e.target.value)
          }
        />
        <Input
          label={t('settings.account.newPassword')}
          type="password"
          value={passwordData.newPassword}
          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
        />
        <Input
          label={t('settings.account.confirmPassword')}
          type="password"
          value={passwordData.confirmPassword}
          onChange={(e) =>
            handlePasswordChange('confirmPassword', e.target.value)
          }
          error={passwordError}
        />
      </div>
      <div className="mt-4 sm:mt-6 flex justify-end">
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
