'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SettingsTab } from '../../types';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const tabs: { key: SettingsTab; labelKey: string }[] = [
  { key: 'store', labelKey: 'settings.tabs.store' },
  { key: 'plan', labelKey: 'settings.tabs.plan' },
  { key: 'account', labelKey: 'settings.tabs.account' },
];

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const t = useTranslations();

  return (
    <div className="border-b border-secondary-200">
      <nav className="flex" aria-label="Settings tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'flex-1 sm:flex-none py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-sm transition-colors text-center',
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>
    </div>
  );
}
