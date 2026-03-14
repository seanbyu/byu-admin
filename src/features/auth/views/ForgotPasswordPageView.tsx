'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Scissors, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useForgotPassword } from '../hooks/useAuth';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPageView() {
  const t = useTranslations('auth.forgotPassword');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordForm>();

  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: (result) => {
        if (result.error) {
          setError('email', { message: t('errors.sendFailed') });
        } else {
          setSentEmail(data.email);
          setSent(true);
        }
      },
      onError: () => {
        setError('email', { message: t('errors.sendFailed') });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">BYU</h1>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {sent ? (
            /* 전송 완료 상태 */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-success-50 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                {t('success.title')}
              </h2>
              <p className="text-sm text-secondary-600 mb-1">
                {t('success.description')}
              </p>
              <p className="text-sm font-medium text-primary-600 mb-4">
                {sentEmail}
              </p>
              <p className="text-xs text-secondary-500 mb-6">
                {t('success.note')}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-[var(--btn-h-md)] px-[var(--btn-px-md)] bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('success.backToLogin')}
              </Link>
            </div>
          ) : (
            /* 이메일 입력 폼 */
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-secondary-900 mb-2">
                  {t('title')}
                </h2>
                <p className="text-sm text-secondary-600">{t('subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('email')}
                  type="email"
                  placeholder={t('placeholders.email')}
                  {...register('email', {
                    required: t('errors.requiredEmail'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('errors.invalidEmail'),
                    },
                  })}
                  error={errors.email?.message}
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={forgotPasswordMutation.isPending}
                >
                  <Mail className="w-4 h-4" />
                  {t('submit')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
