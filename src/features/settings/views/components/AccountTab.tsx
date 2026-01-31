'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AccountInfo } from '../../types';

interface AccountTabProps {
  accountInfo: AccountInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  isChangingPassword: boolean;
  isSendingCode: boolean;
  isVerificationSent: boolean;
  onSave: (data: Partial<AccountInfo>) => Promise<void>;
  onChangePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  onSendVerificationCode: (phone: string) => Promise<void>;
  onVerificationSentChange: (sent: boolean) => void;
}

export function AccountTab({
  accountInfo,
  isLoading,
  isUpdating,
  isChangingPassword,
  isSendingCode,
  isVerificationSent,
  onSave,
  onChangePassword,
  onSendVerificationCode,
  onVerificationSentChange,
}: AccountTabProps) {
  const t = useTranslations();

  const [formData, setFormData] = useState({
    name: accountInfo?.name || '',
    phone: accountInfo?.phone || '',
    verificationCode: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePasswordChange = useCallback((field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError('');
  }, []);

  const handleSendCode = useCallback(async () => {
    await onSendVerificationCode(formData.phone);
    onVerificationSentChange(true);
  }, [formData.phone, onSendVerificationCode, onVerificationSentChange]);

  const handleSaveAccount = useCallback(async () => {
    await onSave({
      name: formData.name,
      phone: formData.phone,
    });
  }, [formData, onSave]);

  const handleChangePassword = useCallback(async () => {
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

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [passwordData, onChangePassword, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info Section */}
      <Card title={t('settings.account.info')}>
        <div className="space-y-4">
          <Input
            label={t('settings.account.username')}
            value={accountInfo?.username || ''}
            disabled
            helperText={t('settings.account.usernameCannotChange')}
          />
          <Input
            label={t('settings.account.name')}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                label={t('settings.account.phone')}
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                type="tel"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSendCode}
              isLoading={isSendingCode}
            >
              {t('settings.account.sendCode')}
            </Button>
          </div>
          {isVerificationSent && (
            <Input
              label={t('settings.account.verificationCode')}
              value={formData.verificationCode}
              onChange={(e) => handleInputChange('verificationCode', e.target.value)}
              placeholder={t('settings.account.enterCode')}
            />
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveAccount} isLoading={isUpdating}>
            {t('common.save')}
          </Button>
        </div>
      </Card>

      {/* Password Change Section */}
      <Card title={t('settings.account.changePassword')}>
        <div className="space-y-4">
          <Input
            label={t('settings.account.currentPassword')}
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
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
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            error={passwordError}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleChangePassword}
            isLoading={isChangingPassword}
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
          >
            {t('settings.account.updatePassword')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
