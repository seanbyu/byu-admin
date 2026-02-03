'use client';

import { Layout } from '@/components/layout/Layout';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { ShopSettingsSection } from '@/features/bookings/components/ShopSettingsSection';
import { StaffBookingSection } from '@/features/bookings/components/StaffBookingSection';
import { InterpreterServiceSection } from '@/features/bookings/components/InterpreterServiceSection';
import { ContactChannelsSection } from '@/features/bookings/components/ContactChannelsSection';

export default function OnlineBookingSettingsPage() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  if (!salonId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-secondary-900">
            {t('nav.onlineBookingSettings')}
          </h1>
          <p className="text-sm text-secondary-600 mt-2">
            {t('booking.settings.description')}
          </p>
        </div>

        {/* 직원 예약 허용 설정 */}
        <StaffBookingSection salonId={salonId} />

        {/* 통역 서비스 설정 */}
        <InterpreterServiceSection salonId={salonId} />

        {/* 문의 채널 설정 */}
        <ContactChannelsSection salonId={salonId} />

        {/* 샵 영업 설정 */}
        <ShopSettingsSection salonId={salonId} />
      </div>
    </Layout>
  );
}
