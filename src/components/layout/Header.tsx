'use client';

import React from 'react';
import { Menu, Bell, Globe, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const languages = [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' },
    { code: 'th', name: 'ภาษาไทย' },
  ];

  const logoutMutation = useLogout({
    onSuccess: () => {
      router.push('/login');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-secondary-200 h-16 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-secondary-700 hover:text-secondary-900 mr-4"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center space-x-2 text-secondary-700 hover:text-secondary-900 transition-colors"
          >
            <Globe size={20} />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    router.replace(pathname, { locale: lang.code });
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary-100 transition-colors ${
                    locale === lang.code
                      ? 'text-primary-600 font-medium'
                      : 'text-secondary-700'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-secondary-700 hover:text-secondary-900 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
              <div className="px-4 py-3 border-b border-secondary-200">
                <h3 className="font-semibold text-secondary-900">알림</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100">
                  <p className="text-sm text-secondary-900 font-medium">
                    새로운 예약이 있습니다
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">5분 전</p>
                </div>
                <div className="px-4 py-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100">
                  <p className="text-sm text-secondary-900 font-medium">
                    고객 리뷰가 등록되었습니다
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">1시간 전</p>
                </div>
                <div className="px-4 py-3 hover:bg-secondary-50 cursor-pointer">
                  <p className="text-sm text-secondary-900 font-medium">
                    예약이 취소되었습니다
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">2시간 전</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-secondary-700 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline text-sm font-medium">
            {t('auth.logout')}
          </span>
        </button>
      </div>
    </header>
  );
};
