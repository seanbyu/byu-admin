'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SettingsTab } from '../../types';

// ============================================
// Tab config - hoisted outside component
// ============================================

const ALL_TABS: { key: SettingsTab; labelKey: string; ownerOnly?: boolean }[] = [
  { key: 'store', labelKey: 'settings.tabs.store', ownerOnly: true },
  { key: 'line', labelKey: 'settings.tabs.line', ownerOnly: true },
  { key: 'plan', labelKey: 'settings.tabs.plan', ownerOnly: true },
  { key: 'account', labelKey: 'settings.tabs.account' },
];

// ============================================
// Tab Link Component (memoized)
// ============================================

interface TabLinkProps {
  tabKey: SettingsTab;
  labelKey: string;
  isActive: boolean;
}

const TabLink = memo(function TabLink({
  tabKey,
  labelKey,
  isActive,
}: TabLinkProps) {
  const t = useTranslations();

  return (
    <Link
      href={`/settings/${tabKey}`}
      className={cn(
        'flex-1 sm:flex-none py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-sm transition-colors text-center',
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
      )}
    >
      {t(labelKey)}
    </Link>
  );
});

// ============================================
// Main Component Props
// ============================================

interface SettingsTabsProps {
  activeTab: SettingsTab;
  isOwner?: boolean;
}

// ============================================
// Main Component
// ============================================

export const SettingsTabs = memo(function SettingsTabs({
  activeTab,
  isOwner = false,
}: SettingsTabsProps) {
  // isOwner가 아니면 ownerOnly 탭은 제외
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => !tab.ownerOnly || isOwner);
  }, [isOwner]);

  return (
    <div className="border-b border-secondary-200">
      <nav className="flex" aria-label="Settings tabs">
        {visibleTabs.map((tab) => (
          <TabLink
            key={tab.key}
            tabKey={tab.key}
            labelKey={tab.labelKey}
            isActive={activeTab === tab.key}
          />
        ))}
      </nav>
    </div>
  );
});
