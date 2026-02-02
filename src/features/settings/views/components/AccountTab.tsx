'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AccountInfo } from '../../types';

// ============================================
// Account Form Section (memoized)
// ============================================

interface AccountFormSectionProps {
  accountInfo: AccountInfo | null;
  isUpdating: boolean;
  isSendingCode: boolean;
  isVerificationSent: boolean;
  onSave: (data: Partial<AccountInfo>) => Promise<void>;
  onSendVerificationCode: (phone: string) => Promise<void>;
  onVerificationSentChange: (sent: boolean) => void;
}

const AccountFormSection = memo(function AccountFormSection({
  accountInfo,
  isUpdating,
  isSendingCode,
  isVerificationSent,
  onSave,
  onSendVerificationCode,
  onVerificationSentChange,
}: AccountFormSectionProps) {
  const t = useTranslations();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    verificationCode: '',
  });

  // Update form when accountInfo changes
  useEffect(() => {
    if (accountInfo) {
      setFormData({
        name: accountInfo.name || '',
        phone: accountInfo.phone || '',
        verificationCode: '',
      });
    }
  }, [accountInfo]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  }, [formData.name, formData.phone, onSave]);

  return (
    <Card title={t('settings.account.info')} padding="sm" className="sm:p-6">
      <div className="space-y-3 sm:space-y-4">
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

        <div className="space-y-2">
          <Input
            label={t('settings.account.phone')}
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            type="tel"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendCode}
            isLoading={isSendingCode}
            className="w-full sm:w-auto"
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
      <div className="mt-4 sm:mt-6 flex justify-end">
        <Button onClick={handleSaveAccount} isLoading={isUpdating} className="w-full sm:w-auto">
          {t('common.save')}
        </Button>
      </div>
    </Card>
  );
});

// ============================================
// Password Change Section (memoized)
// ============================================

interface PasswordChangeSectionProps {
  isChangingPassword: boolean;
  onChangePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const PasswordChangeSection = memo(function PasswordChangeSection({
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
    <Card title={t('settings.account.changePassword')} padding="sm" className="sm:p-6">
      <div className="space-y-3 sm:space-y-4">
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

// ============================================
// Main Component Props
// ============================================

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

// ============================================
// Main Component
// ============================================

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AccountFormSection
        accountInfo={accountInfo}
        isUpdating={isUpdating}
        isSendingCode={isSendingCode}
        isVerificationSent={isVerificationSent}
        onSave={onSave}
        onSendVerificationCode={onSendVerificationCode}
        onVerificationSentChange={onVerificationSentChange}
      />
      <PasswordChangeSection
        isChangingPassword={isChangingPassword}
        onChangePassword={onChangePassword}
      />
    </div>
  );
}
