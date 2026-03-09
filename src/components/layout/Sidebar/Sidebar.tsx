'use client';

import React from 'react';
import { Scissors, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useSidebarMenu } from './useSidebarMenu';
import { SidebarNavMenu } from './SidebarNavMenu';
import { SidebarNotificationPanel } from './SidebarNotificationPanel';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const t = useTranslations();
  const { logout } = useLogout({
    onLogout: () => {
      router.push('/login');
    },
  });

  const filteredMenuItems = useSidebarMenu();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  // Responsive: desktop(xl+) fixed open, tablet/mobile drawer closed by default
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
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
  });

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
          'fixed top-0 left-0 z-50 h-dvh bg-sidebar-bg border-r border-sidebar-border transition-transform duration-300 xl:relative',
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
            <SidebarNavMenu
              menuItems={filteredMenuItems}
              onNavClick={handleNavLinkClick}
            />
            <SidebarNotificationPanel onNavClick={handleNavLinkClick} />
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
