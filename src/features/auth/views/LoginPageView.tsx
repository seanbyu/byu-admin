'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuthStore } from '@/store/authStore';
import { useLogin } from '../hooks/useAuth';
import { Scissors } from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { LanguageSelectModal } from './LanguageSelectModal';
import type { AuthErrorCode, AuthResponse, LoginForm } from '../types';

export default function LoginPageView() {
  const router = useRouter();
  const t = useTranslations('auth.login');
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [showLangModal, setShowLangModal] = useState(true);

  const handleLangModalClose = () => {
    setShowLangModal(false);
    // 모달 닫힌 후 input 자동 포커스 → 키보드 팝업/줌 방지
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };
  const rememberMeRef = useRef(true); // 로그인 상태 유지 값 저장용

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      rememberMe: true, // 기본값: 체크됨
    },
  });

  // 에러 코드에 따른 번역 메시지 반환
  const getErrorMessage = (errorCode?: AuthErrorCode): string => {
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return t('errors.invalidCredentials');
      case 'LOGIN_FAILED':
        return t('errors.loginFailed');
      case 'SALON_PENDING_APPROVAL':
        return t('errors.salonPendingApproval');
      case 'SALON_REJECTED':
        return t('errors.salonRejected');
      case 'STAFF_RESIGNED':
        return t('errors.staffResigned');
      case 'LOGIN_ERROR':
      default:
        return t('errors.loginError');
    }
  };

  const loginMutation = useLogin({
    onSuccess: (response: AuthResponse) => {
      if (response.user && response.token) {
        // rememberMe 값을 login 함수에 전달
        login(response.user, response.token, rememberMeRef.current);
        router.push('/dashboard');
      } else {
        setError(getErrorMessage(response.errorCode));
      }
    },
    onError: () => {
      setError(t('errors.loginError'));
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    // rememberMe 값을 ref에 저장 (onSuccess에서 사용)
    rememberMeRef.current = data.rememberMe;
    loginMutation.mutate({ email: data.email, password: data.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4 relative">
      {showLangModal && <LanguageSelectModal onClose={handleLangModalClose} />}
      <LanguageSwitcher className="absolute top-4 right-4" />
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">Salon Admin</h1>
          <p className="text-secondary-600 mt-2">{t('subtitle')}</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
            {t('title')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('idOrEmail')}
              type="text"
              placeholder={t('placeholders.idOrEmail')}
              {...register('email', {
                required: t('errors.requiredId'),
                // Remove strict email pattern to allow username
              })}
              error={errors.email?.message}
            />

            <Input
              label={t('password')}
              type="password"
              placeholder={t('placeholders.password')}
              {...register('password', {
                required: t('errors.requiredPassword'),
                minLength: {
                  value: 6,
                  message: t('errors.minPassword'),
                },
              })}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <Checkbox
                  defaultChecked
                  {...register('rememberMe')}
                />
                <span className="ml-2 text-sm text-secondary-700">
                  {t('rememberMe')}
                </span>
              </label>

              <a
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {t('forgotPassword')}
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loginMutation.isPending}
            >
              {t('submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              {t('noAccount')}{' '}
              <a
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('registerLink')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
