'use client';

import React, { memo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { createStaff } from '@/actions/staff';
import { Loader2 } from 'lucide-react';
import { createAuthApi } from '@/features/auth/api';
import { PasswordWithConfirm, validatePassword } from '@/components/ui/PasswordInput';

// js-hoist-regexp: 정규식 모듈 레벨로 호이스팅
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// 에러 코드 매핑 (불변 객체)
const ERROR_CODES = {
  CREATE_USER_PROFILE: 'ERROR_CREATE_USER_PROFILE',
  CREATE_STAFF_PROFILE: 'ERROR_CREATE_STAFF_PROFILE',
} as const;

type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';
const authApi = createAuthApi(supabase);

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salonId: string;
  currentStaffCount: number;
}

interface CreateStaffFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: string;
}

const MAX_FREE_STAFF = 5;

function CreateStaffModal({
  isOpen,
  onClose,
  onSuccess,
  salonId,
  currentStaffCount,
}: CreateStaffModalProps) {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateStaffFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'ARTIST',
    },
  });

  const password = watch('password');
  const email = watch('email');

  // 이메일 중복 확인 상태
  const [emailCheckStatus, setEmailCheckStatus] = React.useState<CheckStatus>('idle');
  const [emailCheckMessage, setEmailCheckMessage] = React.useState<string>('');
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const isLimitReached = currentStaffCount >= MAX_FREE_STAFF;

  // 모달 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      reset({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'ARTIST',
      });
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  // 서버 에러 코드를 다국어 메시지로 변환
  const getErrorMessage = useCallback((errorCode: string): string => {
    if (errorCode.startsWith(ERROR_CODES.CREATE_USER_PROFILE)) {
      const detail = errorCode.includes(':') ? errorCode.split(':')[1].trim() : '';
      return t('staff.errors.createUserProfile') + (detail ? ` (${detail})` : '');
    }
    if (errorCode.startsWith(ERROR_CODES.CREATE_STAFF_PROFILE)) {
      const detail = errorCode.includes(':') ? errorCode.split(':')[1].trim() : '';
      return t('staff.errors.createStaffProfile') + (detail ? ` (${detail})` : '');
    }
    return errorCode || t('staff.errors.createFailed');
  }, [t]);

  // 이메일 중복 확인 mutation
  const emailCheckMutation = useMutation({
    mutationFn: async (emailValue: string) => {
      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 10000);
      });
      const checkPromise = authApi.checkDuplicate({ type: 'email', value: emailValue });
      return Promise.race([checkPromise, timeoutPromise]);
    },
    onMutate: () => {
      setEmailCheckStatus('checking');
      setEmailCheckMessage('');
    },
    onSuccess: (data) => {
      if (data.available) {
        setEmailCheckStatus('available');
        setEmailCheckMessage(t('staff.validation.emailAvailable'));
      } else {
        setEmailCheckStatus('taken');
        setEmailCheckMessage(t('staff.validation.emailTaken'));
      }
    },
    onError: () => {
      setEmailCheckStatus('error');
      setEmailCheckMessage(t('staff.validation.emailCheckError'));
    },
  });

  // 이메일 중복 확인 핸들러
  const handleCheckEmail = useCallback(() => {
    if (!email || !EMAIL_REGEX.test(email)) return;
    emailCheckMutation.mutate(email);
  }, [email, emailCheckMutation]);

  // 이메일 변경 시 체크 상태 리셋
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('email', e.target.value);
    if (emailCheckStatus !== 'idle') {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
    }
  }, [setValue, emailCheckStatus]);

  // 직원 생성 mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: CreateStaffFormData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(t('staff.validation.loginRequired'));
      }

      const result = await createStaff({
        salonId,
        email: data.email,
        name: data.name,
        role: data.role,
        password: data.password,
        accessToken: session.access_token,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      setSubmitError(getErrorMessage(error.message));
    },
  });

  // 폼 제출 핸들러
  const onSubmit = useCallback(async (data: CreateStaffFormData) => {
    setSubmitError(null);

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      setSubmitError(t('staff.validation.passwordPattern'));
      return;
    }

    // 비밀번호 일치 확인
    if (data.password !== data.confirmPassword) {
      setSubmitError(t('staff.validation.passwordMismatch'));
      return;
    }

    // 이메일 중복 확인 여부 체크
    if (emailCheckStatus !== 'available') {
      setSubmitError(t('staff.validation.emailCheckRequired'));
      return;
    }

    createStaffMutation.mutate(data);
  }, [emailCheckStatus, createStaffMutation, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('staff.createModal.title')}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {/* 이메일 입력 */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            {t('staff.createModal.email')}
          </label>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              {...register('email', {
                required: t('staff.validation.emailRequired'),
                pattern: {
                  value: EMAIL_REGEX,
                  message: t('staff.validation.emailInvalid'),
                },
              })}
              onChange={handleEmailChange}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.email ? 'border-red-500' : emailCheckStatus === 'available' ? 'border-green-500' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
              disabled={isLimitReached}
            />
            <button
              type="button"
              onClick={handleCheckEmail}
              disabled={isLimitReached || emailCheckMutation.isPending || !email || !EMAIL_REGEX.test(email)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {emailCheckMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('staff.validation.checkDuplicate')
              )}
            </button>
          </div>
          {errors.email ? (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          ) : emailCheckMessage ? (
            <p className={`text-sm ${emailCheckStatus === 'available' ? 'text-green-600' : 'text-red-600'}`}>
              {emailCheckMessage}
            </p>
          ) : (
            <p className="text-xs text-gray-500">{t('staff.createModal.emailHint')}</p>
          )}
        </div>

        {/* 비밀번호 + 확인 (공통 컴포넌트) */}
        <PasswordWithConfirm
          password={password}
          confirmPassword={watch('confirmPassword')}
          onPasswordChange={(value) => setValue('password', value)}
          onConfirmChange={(value) => setValue('confirmPassword', value)}
          passwordLabel={t('staff.createModal.password')}
          confirmLabel={t('staff.createModal.confirmPassword')}
          passwordPlaceholder={t('staff.createModal.passwordPlaceholder')}
          confirmPlaceholder={t('staff.createModal.confirmPasswordPlaceholder')}
          disabled={isLimitReached}
        />

        {/* 이름 입력 */}
        <Input
          label={t('staff.createModal.name')}
          {...register('name', { required: true })}
          placeholder={t('staff.createModal.namePlaceholder')}
          disabled={isLimitReached}
        />

        {/* 역할 선택 */}
        <div className="space-y-2">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            {t('staff.createModal.role')}
          </label>
          <select
            id="role"
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLimitReached}
          >
            <option value="MANAGER">{t('staff.createModal.roleManager')}</option>
            <option value="ARTIST">{t('staff.createModal.roleArtist')}</option>
            <option value="STAFF">{t('staff.createModal.roleStaff')}</option>
          </select>
        </div>

        {/* 에러 메시지 */}
        {submitError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {submitError}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end pt-4 space-x-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={createStaffMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLimitReached}
            isLoading={createStaffMutation.isPending}
          >
            {t('staff.createModal.createAccount')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// rerender-memo: 컴포넌트 메모이제이션
export default memo(CreateStaffModal);
