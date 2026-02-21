'use client';

import React from 'react';
import { Menu, Bell, Globe } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  getRelativeTime,
  getNotificationMessage,
} from '@/features/notifications/hooks/useNotifications';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // 알림 데이터 조회
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications(10);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const languages = [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' },
    { code: 'th', name: 'ภาษาไทย' },
  ];

  // 알림 클릭 핸들러
  const handleNotificationClick = (notificationId: string, bookingId: string | null) => {
    markAsRead(notificationId);
    if (bookingId) {
      router.push(`/bookings/calendar`);
    }
    setShowNotifications(false);
  };

  return (
    <header className="bg-white border-b border-secondary-200 h-16 flex items-center justify-between px-3 sm:px-4 md:px-5 xl:px-6">
      {/* Left side */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="xl:hidden text-secondary-700 hover:text-secondary-900 mr-3 sm:mr-4"
        >
          <Menu size={22} />
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
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
          >
            <Bell size={20} className="-translate-y-px" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-error-500 rounded-full text-[10px] leading-none text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
              <div className="px-4 py-3 border-b border-secondary-200 flex justify-between items-center">
                <h3 className="font-semibold text-secondary-900">{t('common.notifications.title')}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    모두 읽음
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="px-4 py-8 text-center text-secondary-500">
                    <p className="text-sm">{t('common.loading')}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-secondary-500">
                    <p className="text-sm">{t('common.notifications.noNotifications')}</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id, notification.booking_id)}
                      className={`px-4 py-3 hover:bg-secondary-50 cursor-pointer ${
                        index !== notifications.length - 1 ? 'border-b border-secondary-100' : ''
                      } ${!notification.read_at ? 'bg-primary-50' : ''}`}
                    >
                      <p className={`text-sm ${!notification.read_at ? 'font-semibold text-secondary-900' : 'text-secondary-700'}`}>
                        {getNotificationMessage(notification, t)}
                      </p>
                      {notification.body && notification.title && (
                        <p className="text-xs text-secondary-600 mt-1">{notification.body}</p>
                      )}
                      <p className="text-xs text-secondary-500 mt-1">
                        {getRelativeTime(notification.created_at, t)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-secondary-200 text-center">
                  <button
                    onClick={() => {
                      router.push('/bookings/calendar');
                      setShowNotifications(false);
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {t('common.notifications.viewAll')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User info (moved from sidebar) */}
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
