import { useMemo } from 'react';
import { useMenus, useCategories } from '@/features/salon-menus/hooks/useSalonMenus';
import { SalonMenu } from '@/features/salon-menus/types';

/**
 * Returns a memoized map of categoryId -> categoryName
 */
export function useCategoryMap(salonId: string): Record<string, string> {
  const { categories } = useCategories(salonId);
  return useMemo(() => {
    const map: Record<string, string> = {};
    (categories || []).forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);
}

/**
 * Returns a memoized map of menuId -> SalonMenu
 */
export function useMenuMap(salonId: string): Record<string, SalonMenu> {
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });
  return useMemo(() => {
    const map: Record<string, SalonMenu> = {};
    (menus || []).forEach((menu) => {
      map[menu.id] = menu;
    });
    return map;
  }, [menus]);
}

/**
 * Returns a memoized map of serviceId (menuId) -> categoryName.
 * Used in StaffDaySheetView to display category names for bookings.
 */
export function useServiceCategoryMap(salonId: string): Record<string, string> {
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });
  const { categories } = useCategories(salonId);
  return useMemo(() => {
    const categoryMap: Record<string, string> = {};
    (categories || []).forEach((cat) => {
      categoryMap[cat.id] = cat.name;
    });

    const map: Record<string, string> = {};
    (menus || []).forEach((menu) => {
      if (menu.category_id && categoryMap[menu.category_id]) {
        map[menu.id] = categoryMap[menu.category_id];
      }
    });
    return map;
  }, [menus, categories]);
}
