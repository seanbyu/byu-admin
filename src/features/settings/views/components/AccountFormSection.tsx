'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput';
import { AccountFormSectionProps } from '../../types';

export const AccountFormSection = memo(function AccountFormSection({
  accountInfo,
  isUpdating,
  isSendingCode,
  isVerificationSent,
  isVerifying,
  isPhoneVerified,
  onSave,
  onSendVerificationCode,
  onVerifyCode,
  onVerificationSentChange,
  onPhoneVerifiedChange,
}: AccountFormSectionProps) {
  const t = useTranslations();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    verificationCode: '',
  });

  // 리셋 트리거 (전화번호 변경 시 증가)
  const [resetTrigger, setResetTrigger] = useState(0);

  // 에러 메시지 상태
  const [verifyError, setVerifyError] = useState<string | null>(null);

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

  const handlePhoneChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, phone: value, verificationCode: '' }));
    // 전화번호 변경 시 인증 상태 및 에러 리셋
    onVerificationSentChange(false);
    onPhoneVerifiedChange(false);
    setVerifyError(null);
    setResetTrigger((prev) => prev + 1);
  }, [onVerificationSentChange, onPhoneVerifiedChange]);

  const handleSendCode = useCallback(async () => {
    try {
      await onSendVerificationCode(formData.phone);
      onVerificationSentChange(true);
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }
  }, [formData.phone, onSendVerificationCode, onVerificationSentChange]);

  const handleVerifyCode = useCallback(async () => {
    try {
      setVerifyError(null);
      await onVerifyCode(formData.phone, formData.verificationCode);
      onPhoneVerifiedChange(true);
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      // 에러 메시지 표시
      if (error?.message?.includes('expired') || error?.message?.includes('invalid')) {
        setVerifyError(t('settings.account.verifyCodeError'));
      } else {
        setVerifyError(error?.message || t('common.error'));
      }
    }
  }, [formData.phone, formData.verificationCode, onVerifyCode, onPhoneVerifiedChange, t]);

  // 전화번호가 변경되었는지 확인
  const isPhoneChanged = accountInfo?.phone !== formData.phone;

  // 저장 가능 여부: 전화번호 미변경 or 인증 완료
  const canSave = !isPhoneChanged || isPhoneVerified;

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
          <PhoneInput
            label={t('settings.account.phone')}
            value={formData.phone}
            onChange={handlePhoneChange}
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

        {isVerificationSent && !isPhoneVerified && (
          <>
            <VerificationCodeInput
              value={formData.verificationCode}
              onChange={(value) => handleInputChange('verificationCode', value)}
              onVerify={handleVerifyCode}
              onResend={handleSendCode}
              isVerifying={isVerifying}
              isSending={isSendingCode}
              isVerified={isPhoneVerified}
              startTimer={isVerificationSent}
              resetTrigger={resetTrigger}
            />
            {verifyError && (
              <p className="text-sm text-red-500">{verifyError}</p>
            )}
          </>
        )}

        {isPhoneVerified && isPhoneChanged && (
          <div className="flex items-center gap-2 text-green-600">
            <Check size={16} />
            <span className="text-sm">{t('settings.account.phoneVerified')}</span>
          </div>
        )}
      </div>
      <div className="mt-4 sm:mt-6 flex justify-end">
        <Button
          onClick={handleSaveAccount}
          isLoading={isUpdating}
          disabled={!canSave}
          className="w-full sm:w-auto"
        >
          {t('common.save')}
        </Button>
      </div>
    </Card>
  );
});
