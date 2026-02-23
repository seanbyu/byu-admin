'use client';

import React from 'react';
import { Menu, Globe } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [showLangMenu, setShowLangMenu] = React.useState(false);

  const languages = ['ko', 'en', 'th'] as const;

  return (
    <header className="bg-white border-b border-secondary-200 h-16 flex items-center justify-between px-3 sm:px-4 md:px-5 xl:px-6">
      {/* Left side */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="xl:hidden text-secondary-700 hover:text-secondary-900 mr-3 sm:mr-4"
        >
          <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
          >
            <Globe size={18} className="sm:w-5 sm:h-5" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
              {languages.map((langCode) => (
                <button
                  key={langCode}
                  onClick={() => {
                    router.replace(pathname, { locale: langCode });
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary-100 transition-colors ${
                    locale === langCode
                      ? 'text-primary-600 font-medium'
                      : 'text-secondary-700'
                  }`}
                >
                  {t(`common.languageNames.${langCode}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center pl-1 sm:pl-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center shrink-0">
            <span className="text-secondary-700 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="ml-2 min-w-0 hidden md:block">
            <p className="text-sm font-medium text-secondary-900 truncate max-w-[140px] lg:max-w-[200px]">
              {user?.name}
            </p>
            <p className="text-xs text-secondary-500 truncate max-w-[140px] lg:max-w-[200px]">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
