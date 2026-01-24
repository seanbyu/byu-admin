'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useLogin } from '../hooks/useAuth';
import { Scissors } from 'lucide-react';
import { ApiResponse, User } from '@/types';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useTranslations } from 'next-intl';

interface LoginResponse {
  user: User;
  token: string;
}

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPageView() {
  const router = useRouter();
  const t = useTranslations('auth.login');
  const { login } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const loginMutation = useLogin({
    onSuccess: (response: ApiResponse<LoginResponse>) => {
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        router.push('/dashboard');
      } else {
        setError(response.error || '로그인에 실패했습니다');
      }
    },
    onError: (err: Error) => {
      setError('로그인 중 오류가 발생했습니다');
      console.error('Login error:', err);
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    loginMutation.mutate({ email: data.email, password: data.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4 relative">
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
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
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
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
