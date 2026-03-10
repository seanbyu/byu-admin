'use client';

import { useTranslations } from 'next-intl';
import { AccountTabProps } from '../../types';
import { SettingsTabSkeleton } from '@/components/ui/Skeleton';
import { AccountFormSection } from './AccountFormSection';
import { PasswordChangeSection } from './PasswordChangeSection';

export function AccountTab({
  accountInfo,
  isLoading,
  isUpdating,
  isChangingPassword,
  isSendingCode,
  isVerificationSent,
  isVerifying,
  isPhoneVerified,
  onSave,
  onChangePassword,
  onSendVerificationCode,
  onVerifyCode,
  onVerificationSentChange,
  onPhoneVerifiedChange,
}: AccountTabProps) {
  const t = useTranslations();

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AccountFormSection
        accountInfo={accountInfo}
        isUpdating={isUpdating}
        isSendingCode={isSendingCode}
        isVerificationSent={isVerificationSent}
        isVerifying={isVerifying}
        isPhoneVerified={isPhoneVerified}
        onSave={onSave}
        onSendVerificationCode={onSendVerificationCode}
        onVerifyCode={onVerifyCode}
        onVerificationSentChange={onVerificationSentChange}
        onPhoneVerifiedChange={onPhoneVerifiedChange}
      />
      <PasswordChangeSection
        isChangingPassword={isChangingPassword}
        onChangePassword={onChangePassword}
      />
    </div>
  );
}
