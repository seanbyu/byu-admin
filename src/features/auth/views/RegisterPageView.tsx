'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput';
import { PasswordInput, PasswordConfirmInput, validatePassword } from '@/components/ui/PasswordInput';
import { Check, Loader2, ChevronLeft } from 'lucide-react';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { Select } from '@/components/ui/Select';
import { RegisterForm } from '../types';
import { useRegistration } from '../hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function RegisterPageView() {
  const router = useRouter();
  const t = useTranslations('auth.register');
  const tInd = useTranslations('auth.industries');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Phone Auth State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const INDUSTRIES = [
    { label: tInd('HAIR'), value: 'HAIR' },
    { label: tInd('NAIL'), value: 'NAIL' },
    { label: tInd('ESTHETIC'), value: 'ESTHETIC' },
    { label: tInd('MASSAGE'), value: 'MASSAGE' },
    { label: tInd('BARBERSHOP'), value: 'BARBERSHOP' },
  ];

  const {
    emailStatus,
    emailMessage,
    salonNameStatus,
    salonNameMessage,
    checkDuplicate,
    registerOwner,
  } = useRegistration();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      countryCode: '+66',
      industryNames: [],
    },
  });

  const industryNames = watch('industryNames');
  const salonName = watch('salonName');
  const email = watch('email');
  const phone = watch('phone');
  const countryCode = watch('countryCode');
  const otp = watch('otp');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const toggleIndustry = (value: string) => {
    const current = industryNames || [];
    if (current.includes(value)) {
      setValue(
        'industryNames',
        current.filter((i) => i !== value)
      );
    } else {
      setValue('industryNames', [...current, value]);
    }
  };

  const handleCheckDuplicate = async (
    type: 'email' | 'salonName',
    value: string
  ) => {
    const isValid = await trigger(type === 'email' ? 'email' : 'salonName');
    if (!isValid) return;

    // Direct check, no appending
    await checkDuplicate(type, value);
  };

  const formattedPhone = () => {
    if (!phone) return '';
    let clean = phone.replace(/-/g, '');
    if (clean.startsWith('0')) clean = clean.substring(1);
    return `${countryCode}${clean}`;
  };

  const handleSendOtp = async () => {
    const isValid = await trigger(['phone', 'countryCode']);
    if (!isValid) return;

    setOtpLoading(true);
    setError('');
    try {
      const fullPhone = formattedPhone();
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) throw error;

      setOtpSent(true);
      alert(t('success.otpSent'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('errors.otpSendFailed'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError(t('errors.otpRequired'));
      return;
    }

    setOtpLoading(true);
    setError('');
    try {
      const fullPhone = formattedPhone();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      if (!data.user) throw new Error(t('errors.authFailed'));

      setOtpVerified(true);
      setVerifiedUser(data.user);
      alert(t('success.otpVerified'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('errors.otpVerifyFailed'));
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setError('');

    // Pre-checks
    if (!otpVerified || !verifiedUser) {
      setError(t('errors.verifyPhone'));
      return;
    }

    // Password validation
    const passwordValidation = validatePassword(data.password || '');
    if (!passwordValidation.isValid) {
      setError(t('errors.invalidPassword'));
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (emailStatus !== 'available') {
      // Optional: Block if email not checked? Or rely on server error?
      // Better to encourage check.
      if (emailStatus === 'idle') {
        await handleCheckDuplicate('email', data.email);
        // After check, status updates asynchronously. This logic is tricky in React non-async state.
        // For now, let generic error catch it or let user click button.
      }
    }

    if (salonNameStatus !== 'available') {
      // same logic
    }

    if (!data.industryNames || data.industryNames.length === 0) {
      setError(t('errors.selectIndustry'));
      return;
    }

    setIsLoading(true);

    try {
      // Use real email
      await registerOwner({
        userId: verifiedUser.id,
        email: data.email,
        password: data.password,
        name: data.name,
        salonName: data.salonName,
        phone: formattedPhone(),
        industryNames: data.industryNames,
      });

      alert(t('success.registerComplete'));
      router.push('/login');
    } catch (err: any) {
      setError(err.message || t('errors.genericError'));
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12 relative">
      <LanguageSwitcher className="absolute top-4 right-4" />
      <div className="max-w-md w-full border border-secondary-200 rounded-xl p-8 shadow-sm">
        {/* Header with Back Button */}
        <div className="relative flex items-center justify-center mb-10">
          <button
            onClick={() => router.push('/login')}
            className="absolute left-0 p-1 -ml-1 text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-secondary-900">{t('title')}</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 text-error-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary-900">
              {t('id')} <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={t('placeholders.id')}
                  {...register('email', {
                    required: t('errors.required'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('helpers.id'),
                    },
                  })}
                  error={errors.email?.message}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCheckDuplicate('email', email)}
                disabled={emailStatus === 'checking' || !email}
                className="h-[42px]"
              >
                {emailStatus === 'checking' ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  t('checkDuplicate')
                )}
              </Button>
            </div>
            {emailMessage && (
              <p
                className={`text-xs ${emailStatus === 'available' ? 'text-success-600' : 'text-error-600'}`}
              >
                {emailMessage}
              </p>
            )}
            <p className="text-xs text-secondary-400">{t('helpers.id')}</p>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-secondary-900">
                {t('password')} <span className="text-error-500">*</span>
              </label>
              <PasswordInput
                value={password || ''}
                onChange={(value) => setValue('password', value)}
                placeholder={t('placeholders.password')}
                showValidationRules={true}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-secondary-900">
                {t('confirmPassword')} <span className="text-error-500">*</span>
              </label>
              <PasswordConfirmInput
                password={password || ''}
                confirmPassword={confirmPassword || ''}
                onConfirmChange={(value) => setValue('confirmPassword', value)}
                placeholder={t('placeholders.confirmPassword')}
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary-900">
              {t('name')} <span className="text-error-500">*</span>
            </label>
            <Input
              placeholder={t('placeholders.name')}
              {...register('name', { required: t('errors.required') })}
              error={errors.name?.message}
            />
            <p className="text-xs text-secondary-400">{t('helpers.name')}</p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary-900">
              {t('salonName')} <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={t('placeholders.salonName')}
                  {...register('salonName', {
                    required: t('errors.required'),
                    pattern: {
                      value: /^[a-zA-Z0-9_가-힣]+$/,
                      message: t('errors.salonNamePattern'),
                    },
                  })}
                  error={errors.salonName?.message}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCheckDuplicate('salonName', salonName)}
                disabled={salonNameStatus === 'checking' || !salonName}
                className="h-[42px]"
              >
                {salonNameStatus === 'checking' ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  t('checkDuplicate')
                )}
              </Button>
            </div>
            {salonNameMessage && (
              <p
                className={`text-xs ${salonNameStatus === 'available' ? 'text-success-600' : 'text-error-600'}`}
              >
                {salonNameMessage}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-900 mb-2">
              {t('industry')} <span className="text-error-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map((ind) => {
                const isSelected = industryNames?.includes(ind.value);
                return (
                  <button
                    key={ind.value}
                    type="button"
                    onClick={() => toggleIndustry(ind.value)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border text-sm font-medium transition-all
                        ${isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'}`}
                  >
                    {ind.label}
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Phone Verification */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary-900">
              {t('phone')} <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="w-[100px]">
                <Select
                  options={[
                    { value: '+66', label: '+66' },
                    { value: '+82', label: '+82' },
                  ]}
                  {...register('countryCode')}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder={t('placeholders.phone')}
                  {...register('phone', { required: true })}
                  disabled={otpSent}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendOtp}
                disabled={otpLoading || otpSent}
                className="h-[42px] min-w-[60px]"
              >
                {otpSent ? t('resendOtp') : t('sendOtp')}
              </Button>
            </div>

            {otpSent && !otpVerified && (
              <div className="mt-2">
                <VerificationCodeInput
                  value={otp || ''}
                  onChange={(value) => setValue('otp', value)}
                  onVerify={handleVerifyOtp}
                  onResend={handleSendOtp}
                  isVerifying={otpLoading}
                  isSending={otpLoading}
                  isVerified={otpVerified}
                  startTimer={otpSent}
                />
              </div>
            )}
            {otpVerified && (
              <p className="text-sm text-success-600 mt-1">
                {t('success.otpVerified')}
              </p>
            )}
          </div>

          <div className="pt-6">
            <p className="text-xs text-secondary-500 text-center mb-4">
              {t('helpers.agreement')}
            </p>
            <Button
              type="submit"
              variant="primary"
              className={`w-full h-12 text-lg font-medium border-none ${
                otpVerified
                  ? 'bg-primary-700 text-white hover:bg-primary-800'
                  : 'bg-secondary-200 text-secondary-500 hover:bg-secondary-300 hover:text-secondary-700'
              }`}
              disabled={isLoading || !otpVerified}
            >
              {t('submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
