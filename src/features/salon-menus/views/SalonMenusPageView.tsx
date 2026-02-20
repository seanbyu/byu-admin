'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { Layout } from '@/components/layout/Layout';
import { useSalonMenusView } from '../hooks/useSalonMenusView';
import { PageHeader } from './components/PageHeader';
import { IndustryTabs } from './components/IndustryTabs';
import { IndustryReorderPanel } from './components/IndustryReorderPanel';
import MenuList from './components/MenuList';

// bundle-dynamic-imports: 모달은 초기 로드에 필요하지 않으므로 동적 임포트
const IndustrySelectionModal = dynamic(
  () => import('./components/IndustrySelectionModal'),
  { ssr: false }
);

// 로딩 컴포넌트 (rendering-hoist-jsx)
function LoadingState() {
  const t = useTranslations('common');
  return (
    <Layout>
      <div className="p-8">{t('loading')}</div>
    </Layout>
  );
}

// 살롱 정보 없음 컴포넌트 (rendering-hoist-jsx)
function NoSalonState() {
  const t = useTranslations('common');
  return <div className="p-8">{t('noData')}</div>;
}

export default function SalonMenusPageView() {
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // 권한 체크
  const { canWrite, canDelete } = usePermission();
  const canEditMenus = canWrite(PermissionModules.MENUS);
  const canDeleteMenus = canDelete(PermissionModules.MENUS);

  // Custom Hook으로 모든 상태 및 로직 분리
  const {
    // 데이터
    industries,
    selectedIndustries,
    selectedIndustryIds,
    isLoading,
    // 상태
    selectedTab,
    showReorderSettings,
    showIndustryModal,
    // 액션
    setSelectedTab,
    toggleReorderSettings,
    openIndustryModal,
    closeIndustryModal,
    handleToggleIndustry,
    handleReorderIndustries,
  } = useSalonMenusView(salonId);

  // js-early-exit: 로딩 상태 조기 반환
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Layout>
      <div className="p-3 sm:p-4 md:p-6 xl:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          onSettingsClick={canEditMenus ? toggleReorderSettings : undefined}
          isSettingsActive={showReorderSettings}
        />

        {/* Industry Tabs */}
        <IndustryTabs
          selectedTab={selectedTab}
          selectedIndustries={selectedIndustries}
          onSelectTab={setSelectedTab}
          onAddIndustryClick={canEditMenus ? openIndustryModal : undefined}
        />

        {/* Selected Industries Reordering Panel */}
        {showReorderSettings && (
          <IndustryReorderPanel
            selectedIndustries={selectedIndustries}
            onReorder={handleReorderIndustries}
          />
        )}

        {/* Industry Selection Modal - bundle-conditional */}
        {showIndustryModal && (
          <IndustrySelectionModal
            isOpen={showIndustryModal}
            onClose={closeIndustryModal}
            industries={industries}
            selectedIndustryIds={selectedIndustryIds}
            onToggleIndustry={handleToggleIndustry}
          />
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[460px] md:min-h-[520px] xl:min-h-[600px]">
          {salonId ? (
            <MenuList
              salonId={salonId}
              orderedIndustries={selectedIndustries}
              selectedTab={selectedTab}
              canEdit={canEditMenus}
              canDelete={canDeleteMenus}
            />
          ) : (
            <NoSalonState />
          )}
        </div>
      </div>
    </Layout>
  );
}
