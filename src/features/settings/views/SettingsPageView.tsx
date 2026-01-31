'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import {
  useSettingsUIStore,
  selectActiveTab,
  selectIsVerificationSent,
  selectSettingsActions,
} from '../stores/settingsStore';
import {
  useStoreInfo,
  usePlans,
  useSubscription,
  usePhoneVerification,
  usePasswordChange,
} from '../hooks/useSettings';
import { SettingsTabs } from './components/SettingsTabs';
import { StoreInfoTab } from './components/StoreInfoTab';
import { PlanTab } from './components/PlanTab';
import { AccountTab } from './components/AccountTab';
import { AccountInfo } from '../types';

export default function SettingsPageView() {
  const t = useTranslations();
  const { user, updateUser } = useAuthStore();
  const salonId = user?.salonId || '';

  // UI State (Zustand)
  const activeTab = useSettingsUIStore(selectActiveTab);
  const isVerificationSent = useSettingsUIStore(selectIsVerificationSent);
  const actions = useSettingsUIStore(selectSettingsActions);

  // Data fetching (TanStack Query)
  const storeInfoQuery = useStoreInfo(salonId, { enabled: !!salonId });
  const plansQuery = usePlans();
  const subscriptionQuery = useSubscription(salonId, { enabled: !!salonId });
  const phoneVerification = usePhoneVerification();
  const passwordChange = usePasswordChange();

  // Convert authStore user to AccountInfo format
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

  // Handlers
  const handleStoreInfoSave = useCallback(
    async (data: Parameters<typeof storeInfoQuery.updateStoreInfo>[0]) => {
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

  const handlePlanUpgrade = useCallback(
    async (planId: string) => {
      await subscriptionQuery.upgradePlan(planId);
    },
    [subscriptionQuery]
  );

  const handleAccountSave = useCallback(
    async (data: Partial<AccountInfo>) => {
      // Update local authStore
      updateUser({
        name: data.name,
        phone: data.phone,
      });
    },
    [updateUser]
  );

  const handlePasswordChange = useCallback(
    async (data: { currentPassword: string; newPassword: string }) => {
      if (user?.id) {
        await passwordChange.changePassword({ userId: user.id, ...data });
      }
    },
    [user?.id, passwordChange]
  );

  const handleSendVerificationCode = useCallback(
    async (phone: string) => {
      await phoneVerification.sendCode(phone);
    },
    [phoneVerification]
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {t('settings.title')}
          </h1>
        </div>

        {/* Tabs */}
        <SettingsTabs activeTab={activeTab} onTabChange={actions.setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'store' && (
            <StoreInfoTab
              storeInfo={storeInfoQuery.storeInfo}
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
              isUpdating={false}
              isChangingPassword={passwordChange.isChangingPassword}
              isSendingCode={phoneVerification.isSendingCode}
              isVerificationSent={isVerificationSent}
              onSave={handleAccountSave}
              onChangePassword={handlePasswordChange}
              onSendVerificationCode={handleSendVerificationCode}
              onVerificationSentChange={actions.setVerificationSent}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
