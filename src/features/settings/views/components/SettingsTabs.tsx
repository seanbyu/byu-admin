'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SettingsTab } from '../../types';

// ============================================
// Tab config - hoisted outside component
// ============================================

const TABS: { key: SettingsTab; labelKey: string }[] = [
  { key: 'store', labelKey: 'settings.tabs.store' },
  { key: 'plan', labelKey: 'settings.tabs.plan' },
  { key: 'account', labelKey: 'settings.tabs.account' },
];

// ============================================
// Tab Button Component (memoized)
// ============================================

interface TabButtonProps {
  tabKey: SettingsTab;
  labelKey: string;
  isActive: boolean;
  onClick: (tab: SettingsTab) => void;
}

const TabButton = memo(function TabButton({
  tabKey,
  labelKey,
  isActive,
  onClick,
}: TabButtonProps) {
  const t = useTranslations();

  const handleClick = useCallback(() => {
    onClick(tabKey);
  }, [onClick, tabKey]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex-1 sm:flex-none py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-sm transition-colors text-center',
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
      )}
    >
      {t(labelKey)}
    </button>
  );
});

// ============================================
// Main Component Props
// ============================================

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

// ============================================
// Main Component
// ============================================

export const SettingsTabs = memo(function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="border-b border-secondary-200">
      <nav className="flex" aria-label="Settings tabs">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            tabKey={tab.key}
            labelKey={tab.labelKey}
            isActive={activeTab === tab.key}
            onClick={onTabChange}
          />
        ))}
      </nav>
    </div>
  );
});
