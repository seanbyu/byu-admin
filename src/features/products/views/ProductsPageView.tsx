'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import ProductList from './components/ProductList';

function LoadingState() {
  const t = useTranslations('common');
  return <div className="p-8">{t('loading')}</div>;
}

function NoSalonState() {
  const t = useTranslations('common');
  return <div className="p-8">{t('noData')}</div>;
}

export default function ProductsPageView() {
  const t = useTranslations('product');
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const { canWrite, canDelete } = usePermission();
  const canEditProducts = canWrite(PermissionModules.MENUS);
  const canDeleteProducts = canDelete(PermissionModules.MENUS);

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-3 md:mb-5 xl:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-secondary-900">
          {t('title')}
        </h1>
        <p className="text-xs sm:text-sm text-secondary-500 mt-1">
          {t('pageDescription')}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 min-h-[460px] md:min-h-[520px] xl:min-h-[600px]">
        {salonId ? (
          <ProductList
            salonId={salonId}
            canEdit={canEditProducts}
            canDelete={canDeleteProducts}
          />
        ) : (
          <NoSalonState />
        )}
      </div>
    </div>
  );
}
