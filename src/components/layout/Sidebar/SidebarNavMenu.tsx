'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, usePathname } from '@/i18n/routing';
import { MenuItem } from './useSidebarMenu';

interface SidebarNavMenuProps {
  menuItems: MenuItem[];
  onNavClick: () => void;
}

export const SidebarNavMenu = React.memo(function SidebarNavMenu({
  menuItems,
  onNavClick,
}: SidebarNavMenuProps) {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([
    'booking-management',
    'salon-management',
    'customer-management',
  ]);

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  return (
    <ul className="space-y-1.5 md:space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;

        if (item.subItems) {
          const isOpen = item.id ? openSubmenus.includes(item.id) : false;

          return (
            <li key={item.name}>
              <button
                onClick={() => item.id && toggleSubmenu(item.id)}
                className={cn(
                  'flex items-center w-full px-2.5 md:px-3.5 xl:px-4 py-2 md:py-2.5 rounded-[var(--btn-radius)] transition-colors justify-between',
                  'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-hover-text'
                )}
              >
                <div className="flex items-center">
                  <Icon size={17} className="mr-2 md:mr-2.5 xl:mr-3 shrink-0" />
                  <span className="font-medium text-[13px] md:text-sm xl:text-[15px] truncate">
                    {item.name}
                  </span>
                </div>
                <ChevronRight
                  size={15}
                  className={cn(
                    'transition-transform duration-300 ease-out',
                    isOpen && 'rotate-90'
                  )}
                />
              </button>

              <div
                aria-hidden={!isOpen}
                className={cn(
                  'grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'
                )}
              >
                <ul className="min-h-0 ml-2.5 md:ml-3.5 space-y-1 border-l-2 border-sidebar-sub-border pl-2">
                  {item.subItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    const SubIcon = subItem.icon;
                    return (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href || '#'}
                          onClick={onNavClick}
                          className={cn(
                            'flex items-center px-2.5 md:px-3.5 xl:px-4 py-1.5 md:py-2 rounded-[var(--btn-radius)] transition-colors text-[11px] md:text-xs xl:text-sm',
                            isSubActive
                              ? 'text-sidebar-active-text font-medium bg-sidebar-active'
                              : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-hover-text'
                          )}
                          tabIndex={isOpen ? 0 : -1}
                          aria-hidden={!isOpen}
                        >
                          <SubIcon size={15} className="mr-2 md:mr-2.5 xl:mr-3 shrink-0" />
                          <span>{subItem.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        }

        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href || '#'}
              onClick={onNavClick}
              className={cn(
                'flex items-center px-2.5 md:px-3.5 xl:px-4 py-2 md:py-2.5 rounded-[var(--btn-radius)] transition-colors',
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
  );
});
