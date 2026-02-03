'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import {
  useSettingsUIStore,
  selectActiveTab,
  selectIsVerificationSent,
  selectIsPhoneVerified,
  selectSettingsActions,
} from '../stores/settingsStore';
import {
  useStoreInfo,
  usePlans,
  useSubscription,
  useAccountInfo,
  usePhoneVerification,
  usePasswordChange,
} from '../hooks/useSettings';
import { SettingsTabs } from './components/SettingsTabs';
import { StoreInfoTab } from './components/StoreInfoTab';
import { PlanTab } from './components/PlanTab';
import { AccountTab } from './components/AccountTab';
import { AccountInfo, StoreInfo } from '../types';

// ============================================
// Main Component
// ============================================

export default function SettingsPageView() {
  const t = useTranslations();
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const salonId = user?.salonId || '';

  // ============================================
  // UI State (Zustand) - 순수 UI 상태만
  // ============================================
  const activeTab = useSettingsUIStore(selectActiveTab);
  const isVerificationSent = useSettingsUIStore(selectIsVerificationSent);
  const isPhoneVerified = useSettingsUIStore(selectIsPhoneVerified);
  const actions = useSettingsUIStore(selectSettingsActions);

  // isOwner가 아닌 경우 account 탭으로 강제 이동
  useEffect(() => {
    if (!user?.isOwner && (activeTab === 'store' || activeTab === 'plan')) {
      actions.setActiveTab('account');
    }
  }, [user?.isOwner, activeTab, actions]);

  // ============================================
  // Data fetching (TanStack Query) - 서버 데이터
  // ============================================
  const storeInfoQuery = useStoreInfo(salonId, { enabled: !!salonId });
  const plansQuery = usePlans();
  const subscriptionQuery = useSubscription(salonId, { enabled: !!salonId });
  const phoneVerification = usePhoneVerification();
  const passwordChange = usePasswordChange();

  // ============================================
  // Derived Data
  // ============================================
  const accountInfo = useMemo<AccountInfo | null>(() => {
    if (!user) return null;
    return {
      id: user.id,
      username: user.email || '',
      name: user.name || '',
      phone: user.phone || '',
      email: user.email,
    };
  }, [user]);

  // ============================================
  // Store Info Handlers
  // ============================================
  const handleStoreInfoSave = useCallback(
    async (data: Partial<StoreInfo>) => {
      await storeInfoQuery.updateStoreInfo(data);
    },
    [storeInfoQuery]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      await storeInfoQuery.uploadImage(file);
    },
    [storeInfoQuery]
  );

  const handleImageDelete = useCallback(async () => {
    await storeInfoQuery.deleteImage();
  }, [storeInfoQuery]);

  // ============================================
  // Plan Handlers
  // ============================================
  const handlePlanUpgrade = useCallback(
    async (planId: string) => {
      await subscriptionQuery.upgradePlan(planId);
    },
    [subscriptionQuery]
  );

  // ============================================
  // Account Info (Mutation Only) - DB 저장용
  // ============================================
  const accountInfoMutation = useAccountInfo(user?.id || '');

  // ============================================
  // Account Handlers
  // ============================================
  const handleAccountSave = useCallback(
    async (data: Partial<AccountInfo>) => {
      if (!user?.id) return;

      try {
        // 1. DB에 저장 (API 호출)
        await accountInfoMutation.updateAccountInfo(data);

        // 2. 로컬 상태도 업데이트 (즉시 UI 반영)
        updateUser({
          name: data.name,
          phone: data.phone,
        });

        toast.success(t('common.saved'));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [user?.id, accountInfoMutation, updateUser, toast, t]
  );

  const handlePasswordChange = useCallback(
    async (data: { currentPassword: string; newPassword: string }) => {
      if (!user?.id) return;

      try {
        await passwordChange.changePassword({ userId: user.id, ...data });
        toast.success(t('common.saved'));
      } catch {
        toast.error(t('common.error'));
      }
    },
    [user?.id, passwordChange, toast, t]
  );

  const handleSendVerificationCode = useCallback(
    async (phone: string) => {
      await phoneVerification.sendCode(phone);
    },
    [phoneVerification]
  );

  const handleVerifyCode = useCallback(
    async (phone: string, code: string) => {
      await phoneVerification.verifyCode({ phone, token: code });
    },
    [phoneVerification]
  );

  // ============================================
  // Render
  // ============================================
  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">
            {t('settings.title')}
          </h1>
        </div>

        {/* Tabs */}
        <SettingsTabs
          activeTab={activeTab}
          onTabChange={actions.setActiveTab}
          isOwner={user?.isOwner}
        />

        {/* Tab Content - 조건부 렌더링 */}
        <div className="mt-4 sm:mt-6">
          {activeTab === 'store' && (
            <StoreInfoTab
              salonId={salonId}
              isLoading={storeInfoQuery.isLoading}
              isUpdating={storeInfoQuery.isUpdating}
              isUploadingImage={storeInfoQuery.isUploadingImage}
              onSave={handleStoreInfoSave}
              onUploadImage={handleImageUpload}
              onDeleteImage={handleImageDelete}
            />
          )}

          {activeTab === 'plan' && (
            <PlanTab
              plans={plansQuery.plans}
              subscription={subscriptionQuery.subscription}
              isLoading={plansQuery.isLoading || subscriptionQuery.isLoading}
              isUpgrading={subscriptionQuery.isUpgrading}
              onUpgrade={handlePlanUpgrade}
            />
          )}

          {activeTab === 'account' && (
            <AccountTab
              accountInfo={accountInfo}
              isLoading={false}
              isUpdating={accountInfoMutation.isUpdating}
              isChangingPassword={passwordChange.isChangingPassword}
              isSendingCode={phoneVerification.isSendingCode}
              isVerificationSent={isVerificationSent}
              isVerifying={phoneVerification.isVerifying}
              isPhoneVerified={isPhoneVerified}
              onSave={handleAccountSave}
              onChangePassword={handlePasswordChange}
              onSendVerificationCode={handleSendVerificationCode}
              onVerifyCode={handleVerifyCode}
              onVerificationSentChange={actions.setVerificationSent}
              onPhoneVerifiedChange={actions.setPhoneVerified}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
