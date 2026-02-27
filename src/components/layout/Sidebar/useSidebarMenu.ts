'use client';

import { useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Settings2,
  Users,
  Star,
  TrendingUp,
  Settings,
  Building2,
  Briefcase,
  Menu,
  Package,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/types';

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href?: string;
  roles: UserRole[];
  subItems?: MenuItem[];
  id?: string;
  permissionKey?: string;
}

export function useSidebarMenu(): MenuItem[] {
  const { user } = useAuthStore();
  const t = useTranslations();

  return useMemo(() => {
    const menuItems: MenuItem[] = [
      {
        name: t('nav.dashboard'),
        icon: LayoutDashboard,
        href: '/dashboard',
        roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
        permissionKey: 'dashboard',
      },
      {
        id: 'booking-management',
        name: t('nav.bookings'),
        icon: Calendar,
        roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
        subItems: [
          {
            name: t('nav.bookingChart'),
            icon: Calendar,
            href: '/bookings/chart',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'bookings',
          },
        ],
      },
      {
        id: 'customer-management',
        name: t('nav.customers'),
        icon: Users,
        roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
        subItems: [
          {
            name: t('nav.customerChart'),
            icon: Users,
            href: '/customers/chart',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'customers',
          },
        ],
      },
      {
        id: 'salon-management',
        name: t('nav.salons'),
        icon: Building2,
        roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
        subItems: [
          {
            name: t('nav.onlineBookingSettings'),
            icon: Settings2,
            href: '/bookings/settings',
            roles: [UserRole.MANAGER, UserRole.ADMIN],
            permissionKey: 'bookings',
          },
          {
            name: t('nav.staff'),
            icon: Briefcase,
            href: '/staff',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'staff',
          },
          {
            name: t('nav.menus'),
            icon: Menu,
            href: '/menus',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'menus',
          },
          {
            name: t('nav.products'),
            icon: Package,
            href: '/products',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'menus',
          },
          {
            name: t('nav.reviews'),
            icon: Star,
            href: '/reviews',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'reviews',
          },
          {
            name: t('nav.sales'),
            icon: TrendingUp,
            href: '/sales',
            roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
            permissionKey: 'sales',
          },
        ],
      },
      {
        name: t('nav.settings'),
        icon: Settings,
        href: '/settings',
        roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
        permissionKey: 'settings',
      },
    ];

    const checkPermission = (item: MenuItem): boolean => {
      if (user?.role && !item.roles.includes(user.role)) {
        return false;
      }
      if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) {
        return true;
      }
      if (item.permissionKey) {
        if (!user?.permissions) return false;
        const perm = user.permissions.find((p) => p.module === item.permissionKey);
        return perm?.canRead ?? false;
      }
      return true;
    };

    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          if (item.subItems) {
            const visibleSubItems = filterMenuItems(item.subItems);
            if (user?.role && !item.roles.includes(user.role)) return null;
            if (visibleSubItems.length > 0) {
              return { ...item, subItems: visibleSubItems };
            }
            return null;
          }
          return checkPermission(item) ? item : null;
        })
        .filter((item): item is MenuItem => item !== null);
    };

    return filterMenuItems(menuItems);
  }, [user, t]);
}
