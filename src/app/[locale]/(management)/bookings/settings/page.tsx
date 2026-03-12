'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { Spinner } from '@/components/ui/Spinner';
import { ShopSettingsSection } from '@/features/bookings/views/components/ShopSettingsSection';
import { StaffBookingSection } from '@/features/bookings/views/components/StaffBookingSection';
import { InterpreterServiceSection } from '@/features/bookings/views/components/InterpreterServiceSection';
import { ContactChannelsSection } from '@/features/bookings/views/components/ContactChannelsSection';
import { CategoryCutoffSection } from '@/features/bookings/views/components/CategoryCutoffSection';

export default function OnlineBookingSettingsPage() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const { canRead, isAdmin } = usePermission();
  const canViewBookingSettings = isAdmin || canRead(PermissionModules.BOOKING_SETTINGS);

  if (!salonId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canViewBookingSettings) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <p className="text-secondary-500 text-sm">{t('common.noPermission')}</p>
      </div>
    );
  }

  return (
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

      {/* 카테고리별 마지막 예약 시간 */}
      <CategoryCutoffSection salonId={salonId} />

      {/* 샵 영업 설정 */}
      <ShopSettingsSection salonId={salonId} />
    </div>
  );
}
