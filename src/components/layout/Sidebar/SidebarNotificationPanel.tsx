'use client';

import React, { useState, useCallback } from 'react';
import { Bell, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
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
import { useBookingsUIStore } from '@/features/bookings/stores/bookingsStore';

interface SidebarNotificationPanelProps {
  onNavClick: () => void;
}

export const SidebarNotificationPanel = React.memo(function SidebarNotificationPanel({
  onNavClick,
}: SidebarNotificationPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const { data: notifications = [], isLoading } = useNotifications(20);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const handleNotificationClick = useCallback(
    async (notif: Notification) => {
      if (!notif.read_at) {
        markAsRead(notif.id);
      }

      if (notif.booking_id) {
        const { setHighlightedBookingId, setSelectedDate, setSelectedStaffId } = useBookingsUIStore.getState();

        // 예약 날짜 + 담당 직원 조회하여 해당 날짜/직원 탭으로 이동
        const info = await getBookingInfo(notif.booking_id);
        if (info) {
          setSelectedDate(new Date(info.booking_date + 'T00:00:00'));
          setSelectedStaffId(info.artist_id);
        }

        setHighlightedBookingId(notif.booking_id);
      }

      if (!pathname.includes('/bookings')) {
        router.push('/bookings');
      }
      onNavClick();
    },
    [markAsRead, pathname, router, onNavClick]
  );

  return (
    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-sidebar-border">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-2.5 md:px-3.5 xl:px-4 py-2 md:py-2.5 rounded-lg text-sidebar-text hover:bg-sidebar-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell size={17} className="shrink-0" />
          <span className="font-medium text-[13px] md:text-sm xl:text-[15px]">
            {t('common.notifications.title')}
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error-500 text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {isOpen && (
        <div className="px-1 md:px-1.5 pt-1 pb-1">
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5 px-2">
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-[10px] md:text-[11px] text-sidebar-text-muted hover:text-sidebar-text transition-colors"
              >
                <Check size={12} />
                {t('common.notifications.markAllRead')}
              </button>
            </div>
          )}
          <div className="max-h-48 md:max-h-56 xl:max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
            {isLoading ? (
              <p className="text-center text-sidebar-text-muted text-[11px] md:text-xs py-4">
                {t('common.loading')}
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sidebar-text-muted text-[11px] md:text-xs py-4">
                {t('common.notifications.noNotifications')}
              </p>
            ) : (
              notifications.map((notif) => {
                const detail = getNotificationDetail(notif, t, locale);
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'group/notif w-full text-left flex flex-col gap-0.5 px-2.5 py-2 rounded-lg text-[11px] md:text-xs transition-colors cursor-pointer',
                      notif.read_at
                        ? 'bg-transparent text-sidebar-text-muted hover:bg-sidebar-hover'
                        : 'bg-primary-900/30 text-sidebar-text hover:bg-primary-900/50'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {!notif.read_at && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                      )}
                      <span className="font-medium truncate flex-1">
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
                        className="shrink-0 p-0.5 rounded text-sidebar-text-subtle hover:text-error-400 transition-colors opacity-0 group-hover/notif:opacity-100"
                      >
                        <X size={12} />
                      </span>
                    </div>
                    {detail.dateTime && (
                      <p className="text-[10px] md:text-[11px] text-sidebar-text-muted pl-0.5 truncate">
                        {detail.dateTime}
                      </p>
                    )}
                    {detail.staffService && (
                      <p className="text-[10px] md:text-[11px] text-sidebar-text-muted pl-0.5 truncate">
                        {detail.staffService}
                      </p>
                    )}
                    <div className="text-[10px] md:text-[11px] text-sidebar-text-subtle pl-0.5">
                      {getRelativeTime(notif.created_at, t)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});
