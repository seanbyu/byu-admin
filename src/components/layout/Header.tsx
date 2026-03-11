'use client';

import React from 'react';
import { Menu, Globe, Bell } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useRouter, usePathname } from '@/i18n/routing';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { HeaderNotificationDropdown } from './HeaderNotificationDropdown';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadCount();

  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const [showNotifMenu, setShowNotifMenu] = React.useState(false);

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
        <Link
          href="/dashboard"
          className="text-base sm:text-lg font-bold tracking-wide text-secondary-900 hover:text-primary-600 transition-colors"
        >
          BYU
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        {/* Notification — 모바일/태블릿: 드롭다운, 데스크톱(xl+): 차트 이동 */}
        <div className="relative xl:hidden">
          <button
            onClick={() => setShowNotifMenu((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-error-500 text-white text-[10px] font-bold leading-none flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifMenu && (
            <HeaderNotificationDropdown onClose={() => setShowNotifMenu(false)} />
          )}
        </div>
        <button
          onClick={() => router.push('/bookings/chart')}
          className="relative hidden xl:flex h-9 w-9 items-center justify-center rounded-md text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-error-500 text-white text-[10px] font-bold leading-none flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

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
      </div>
    </header>
  );
};
