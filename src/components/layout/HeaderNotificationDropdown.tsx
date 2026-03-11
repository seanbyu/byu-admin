'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  getRelativeTime,
  getNotificationTitle,
  getNotificationDetail,
} from '@/features/notifications/hooks/useNotifications';
import { type Notification, getBookingInfo } from '@/features/notifications/api';
import { useAuthStore } from '@/store/authStore';

interface HeaderNotificationDropdownProps {
  onClose: () => void;
}

export const HeaderNotificationDropdown = React.memo(function HeaderNotificationDropdown({
  onClose,
}: HeaderNotificationDropdownProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const salonId = user?.salonId;

  const { data: notifications = [], isLoading } = useNotifications(20);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  // 외부 클릭 감지
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      if (!notif.read_at) {
        markAsRead(notif.id);
      }
      onClose();

      if (notif.booking_id && salonId) {
        const info = await getBookingInfo(salonId, notif.booking_id);
        const params = new URLSearchParams({ highlight: notif.booking_id });
        if (info) {
          params.set('date', info.booking_date);
          params.set('staff', info.artist_id);
        }
        router.push(`/bookings/chart?${params.toString()}`);
      } else {
        router.push('/bookings/chart');
      }
    },
    [markAsRead, router, onClose, salonId]
  );

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-lg border border-secondary-200 overflow-hidden z-dropdown"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-secondary-900">
            {t('common.notifications.title')}
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error-500 text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-700 transition-colors"
          >
            <Check size={12} />
            {t('common.notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <p className="text-center text-secondary-400 text-xs py-8">
            {t('common.loading')}
          </p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-secondary-400 text-xs py-8">
            {t('common.notifications.noNotifications')}
          </p>
        ) : (
          <div className="divide-y divide-secondary-100">
            {notifications.map((notif) => {
              const detail = getNotificationDetail(notif, t, locale);
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'group/notif w-full text-left flex flex-col gap-0.5 px-4 py-3 text-xs transition-colors cursor-pointer',
                    notif.read_at
                      ? 'bg-white text-secondary-500 hover:bg-secondary-50'
                      : 'bg-primary-50 text-secondary-800 hover:bg-primary-100'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {!notif.read_at && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                    )}
                    <span className="font-medium truncate flex-1 text-[13px]">
                      {getNotificationTitle(notif, t)}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }
                      }}
                      className="shrink-0 p-0.5 rounded text-secondary-300 hover:text-error-400 transition-colors opacity-0 group-hover/notif:opacity-100"
                    >
                      <X size={13} />
                    </span>
                  </div>
                  {detail.dateTime && (
                    <p className="text-[11px] text-secondary-400 pl-0.5 truncate">
                      {detail.dateTime}
                    </p>
                  )}
                  {detail.staffService && (
                    <p className="text-[11px] text-secondary-400 pl-0.5 truncate">
                      {detail.staffService}
                    </p>
                  )}
                  <p className="text-[11px] text-secondary-300 pl-0.5">
                    {getRelativeTime(notif.created_at, t)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
