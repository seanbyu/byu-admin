'use client';

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  ShoppingBag,
  Star,
  TrendingUp,
  MessageSquare,
  Settings,
  Building2,
  Briefcase,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { UserRole } from '@/types';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const t = useTranslations();

  const [openSubmenus, setOpenSubmenus] = React.useState<string[]>([
    'salon-management',
  ]);

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  interface MenuItem {
    name: string;
    icon: LucideIcon;
    href?: string;
    roles: UserRole[];
    subItems?: MenuItem[];
    id?: string;
    permissionKey?: string;
  }

  const menuItems: MenuItem[] = [
    {
      name: t('nav.dashboard'),
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'dashboard',
    },
    {
      name: t('nav.bookings'),
      icon: Calendar,
      href: '/bookings',
      roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'bookings',
    },
    {
      name: t('nav.customers'),
      icon: Users,
      href: '/customers',
      roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'customers',
    },
    {
      id: 'salon-management',
      name: t('nav.salons'),
      icon: Building2,
      roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF],
      subItems: [
        {
          name: t('nav.staff'),
          icon: Briefcase,
          href: '/staff',
          roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF],
          permissionKey: 'staff',
        },
        {
          name: t('nav.menus'),
          icon: Menu,
          href: '/menus',
          roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF],
          permissionKey: 'menus',
        },
        {
          name: t('nav.reviews'),
          icon: Star,
          href: '/reviews',
          roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
          permissionKey: 'reviews',
        },
        {
          name: t('nav.sales'),
          icon: TrendingUp,
          href: '/sales',
          roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
          permissionKey: 'sales',
        },
      ],
    },
    {
      name: t('nav.chat'),
      icon: MessageSquare,
      href: '/chat',
      roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'chat',
    },
    {
      name: t('nav.settings'),
      icon: Settings,
      href: '/settings',
      roles: [UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'settings',
    },
  ];

  const checkPermission = (item: MenuItem): boolean => {
    // 1. Role Check
    if (user?.role && !item.roles.includes(user.role)) {
      return false;
    }

    // 2. Super Admin & Admin Bypass
    if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) {
      return true;
    }

    // 3. Permission Key Check
    if (item.permissionKey) {
      if (!user?.permissions) return false; // No permissions array = no access to guarded items
      const perm = user.permissions.find(
        (p) => p.module === item.permissionKey
      );
      // Default to false if permission record not found
      return perm?.canRead ?? false;
    }

    return true;
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .map((item) => {
        // If it has subitems, filter them first
        if (item.subItems) {
          const visibleSubItems = filterMenuItems(item.subItems);
          // Check if parent itself has role access (ignoring permissionKey for group parent for now, assuming it depends on children)
          // But we should still check roles for the parent.
          if (user?.role && !item.roles.includes(user.role)) return null;

          if (visibleSubItems.length > 0) {
            return { ...item, subItems: visibleSubItems };
          }
          return null; // Hide parent if no children visible
        }

        // Single item
        return checkPermission(item) ? item : null;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white border-r border-secondary-200 transition-transform duration-300 lg:relative',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
            <Link href="/dashboard" className="flex items-center">
              <Scissors className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-secondary-900">
                Salon Admin
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-secondary-500 hover:text-secondary-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;

                if (item.subItems) {
                  const isOpen = item.id
                    ? openSubmenus.includes(item.id)
                    : false;
                  // Check if any subitem is active to highlight parent
                  const isChildActive = item.subItems.some(
                    (sub) => pathname === sub.href
                  );

                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => item.id && toggleSubmenu(item.id)}
                        className={cn(
                          'flex items-center w-full px-4 py-3 rounded-lg transition-colors justify-between',
                          isChildActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-secondary-700 hover:bg-secondary-100'
                        )}
                      >
                        <div className="flex items-center">
                          <Icon size={20} className="mr-3" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {isOpen ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>

                      {isOpen && (
                        <ul className="mt-1 ml-4 space-y-1 border-l-2 border-secondary-100 pl-2">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            const SubIcon = subItem.icon;
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href || '#'}
                                  className={cn(
                                    'flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm',
                                    isSubActive
                                      ? 'text-primary-700 font-medium bg-primary-50'
                                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                  )}
                                >
                                  <SubIcon size={18} className="mr-3" />
                                  <span>{subItem.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href || '#'}
                      className={cn(
                        'flex items-center px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-secondary-700 hover:bg-secondary-100'
                      )}
                    >
                      <Icon size={20} className="mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          <div className="px-6 py-4 border-t border-secondary-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-900">
                  {user?.name}
                </p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
