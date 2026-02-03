'use client';

import React, { memo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from './Input';
import { Button } from './Button';
import { useVerificationTimer } from './hooks/useVerificationTimer';

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  isVerifying?: boolean;
  isSending?: boolean;
  isVerified?: boolean;
  label?: string;
  placeholder?: string;
  timeout?: number;
  // 타이머 시작 트리거 (true가 되면 타이머 시작)
  startTimer?: boolean;
  // 외부에서 리셋 트리거
  resetTrigger?: number;
}

export const VerificationCodeInput = memo(function VerificationCodeInput({
  value,
  onChange,
  onVerify,
  onResend,
  isVerifying = false,
  isSending = false,
  isVerified = false,
  label,
  placeholder,
  timeout = 180,
  startTimer: shouldStartTimer = false,
  resetTrigger = 0,
}: VerificationCodeInputProps) {
  const t = useTranslations();

  const {
    timeLeft,
    isExpired,
    isRunning,
    formattedTime,
    startTimer,
    resetTimer,
  } = useVerificationTimer({ timeout });

  // 외부에서 타이머 시작 트리거
  useEffect(() => {
    if (shouldStartTimer && !isRunning && !isVerified) {
      startTimer();
    }
  }, [shouldStartTimer, isRunning, isVerified, startTimer]);

  // 외부에서 리셋 트리거 - 값이 실제로 변경될 때만 리셋
  const prevResetTriggerRef = useRef(resetTrigger);
  useEffect(() => {
    if (resetTrigger !== prevResetTriggerRef.current) {
      prevResetTriggerRef.current = resetTrigger;
      resetTimer();
    }
  }, [resetTrigger, resetTimer]);

  // 재전송 핸들러
  const handleResend = () => {
    onResend();
    startTimer();
  };

  // 인증 완료 시 표시하지 않음
  if (isVerified) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={label || t('common.verificationCode')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || t('common.enterCode')}
          />
        </div>
        {isRunning && (
          <div className="pb-2 text-sm font-medium text-primary-600">
            {formattedTime}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onVerify}
          isLoading={isVerifying}
          disabled={!value || isExpired}
          className="w-full sm:w-auto"
        >
          {t('common.verify')}
        </Button>
        {isExpired && timeLeft === 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            isLoading={isSending}
            className="w-full sm:w-auto text-secondary-600"
          >
            {t('common.resend')}
          </Button>
        )}
      </div>

      {isExpired && timeLeft === 0 && (
        <p className="text-sm text-red-500">
          {t('common.codeExpired')}
        </p>
      )}
    </div>
  );
});
