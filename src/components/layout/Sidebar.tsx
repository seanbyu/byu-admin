'use client';

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Settings2,
  Users,
  Scissors,
  Star,
  TrendingUp,
  Settings,
  Building2,
  Briefcase,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { UserRole } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const t = useTranslations();
  const { logout } = useLogout({
    onLogout: () => {
      router.push('/login');
    },
  });

  // Responsive standard: desktop(xl+) fixed open, tablet/mobile drawer closed by default
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarOpen(window.innerWidth >= 1280);
  }, [setSidebarOpen]);

  const { data: salon } = useQuery<{ name: string } | null>({
    queryKey: ['salon', user?.salonId],
    queryFn: async () => {
      if (!user?.salonId) return null;
      const { data } = await supabase
        .from('salons')
        .select('name')
        .eq('id', user.salonId)
        .single();
      return data;
    },
    enabled: !!user?.salonId,
  });

  const [openSubmenus, setOpenSubmenus] = React.useState<string[]>([
    'booking-management',
    'salon-management',
    'customer-management',
  ]);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

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
      roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'dashboard',
    },
    {
      name: t('nav.bookings'),
      icon: Calendar,
      href: '/bookings',
      roles: [UserRole.MANAGER, UserRole.ARTIST, UserRole.STAFF, UserRole.ADMIN],
      permissionKey: 'bookings',
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

  const handleNavLinkClick = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-sidebar-bg border-r border-sidebar-border transition-transform duration-300 xl:relative',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        )}
        style={{ width: 'clamp(220px, 78vw, var(--sidebar-width))' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-3 md:px-4 xl:px-5 py-3 md:py-3.5 xl:py-4 border-b border-sidebar-border">
            <Link
              href="/dashboard"
              onClick={handleNavLinkClick}
              className="flex items-center min-w-0"
            >
              <Scissors className="w-5 h-5 md:w-6 md:h-6 xl:w-7 xl:h-7 text-sidebar-accent shrink-0" />
              <span className="ml-2 text-sm md:text-base xl:text-lg font-bold text-sidebar-text truncate">
                {salon?.name || 'Salon Admin'}
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="xl:hidden text-sidebar-text-subtle hover:text-sidebar-text p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2.5 md:px-3 xl:px-4 py-3 md:py-4 xl:py-5 overflow-y-auto">
            <ul className="space-y-1.5 md:space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;

                if (item.subItems) {
                  const isOpen = item.id
                    ? openSubmenus.includes(item.id)
                    : false;

                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => item.id && toggleSubmenu(item.id)}
                        className={cn(
                          'flex items-center w-full px-2.5 md:px-3.5 xl:px-4 py-2 md:py-2.5 rounded-lg transition-colors justify-between',
                          'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-hover-text'
                        )}
                      >
                        <div className="flex items-center">
                          <Icon size={17} className="mr-2 md:mr-2.5 xl:mr-3 shrink-0" />
                          <span className="font-medium text-[13px] md:text-sm xl:text-[15px] truncate">
                            {item.name}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </button>

                      {isOpen && (
                        <ul className="mt-1 ml-2.5 md:ml-3.5 space-y-1 border-l-2 border-sidebar-sub-border pl-2">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            const SubIcon = subItem.icon;
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href || '#'}
                                  onClick={handleNavLinkClick}
                                  className={cn(
                                    'flex items-center px-2.5 md:px-3.5 xl:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-[11px] md:text-xs xl:text-sm',
                                    isSubActive
                                      ? 'text-sidebar-active-text font-medium bg-sidebar-active'
                                      : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-hover-text'
                                  )}
                                >
                                  <SubIcon size={15} className="mr-2 md:mr-2.5 xl:mr-3 shrink-0" />
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
                      onClick={handleNavLinkClick}
                      className={cn(
                        'flex items-center px-2.5 md:px-3.5 xl:px-4 py-2 md:py-2.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-sidebar-active text-sidebar-active-text'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-hover-text'
                      )}
                    >
                      <Icon size={17} className="mr-2 md:mr-2.5 xl:mr-3 shrink-0" />
                      <span className="font-medium text-[13px] md:text-sm xl:text-[15px] truncate">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="px-3 md:px-4 xl:px-5 py-3 md:py-3.5 xl:py-4 border-t border-sidebar-border">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center xl:justify-start gap-2 px-3 py-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-hover-text transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await logout();
        }}
        title={t('auth.logoutConfirm.title')}
        description={t('auth.logoutConfirm.description')}
      />
    </>
  );
};
