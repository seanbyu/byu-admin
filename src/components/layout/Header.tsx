'use client';

import React from 'react';
import { Menu, Bell, Globe, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
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

  const { logout } = useLogout({
    onLogout: () => {
      router.push('/login');
    },
  });

  // 알림 클릭 핸들러
  const handleNotificationClick = (notificationId: string, bookingId: string | null) => {
    markAsRead(notificationId);
    if (bookingId) {
      router.push(`/bookings/calendar`);
    }
    setShowNotifications(false);
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error-500 rounded-full text-xs text-white flex items-center justify-center">
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

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-secondary-700 hover:text-error-600 transition-colors"
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
