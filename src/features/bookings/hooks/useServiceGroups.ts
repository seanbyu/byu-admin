import { useMemo } from 'react';

export interface ServiceGroupItem {
  categoryId: string;
  categoryName: string;
  count: number;
  totalDuration: number;
  totalPrice: number;
}

interface MenuLike {
  id: string;
  category_id: string;
  name: string;
  duration_minutes?: number;
  base_price?: number;
  price?: number;
}

interface UseServiceGroupsReturn {
  groups: ServiceGroupItem[];
  totalDuration: number;
  totalPrice: number;
}

/**
 * Groups selected service IDs by category, computing count, duration, and price per group.
 */
export function useServiceGroups(
  selectedServiceIds: string[],
  menuMap: Record<string, MenuLike>,
  categoryMap: Record<string, string>
): UseServiceGroupsReturn {
  const groups = useMemo(() => {
    const result: ServiceGroupItem[] = [];
    const groupIndexMap = new Map<string, number>();

    selectedServiceIds.forEach((id) => {
      const menu = menuMap[id];
      if (!menu) return;
      const catId = menu.category_id;
      const idx = groupIndexMap.get(catId);

      if (idx !== undefined) {
        result[idx].count += 1;
        result[idx].totalDuration += menu.duration_minutes || 60;
        result[idx].totalPrice += menu.base_price || menu.price || 0;
      } else {
        groupIndexMap.set(catId, result.length);
        result.push({
          categoryId: catId,
          categoryName: categoryMap[catId] || menu.name,
          count: 1,
          totalDuration: menu.duration_minutes || 60,
          totalPrice: menu.base_price || menu.price || 0,
        });
      }
    });

    return result;
  }, [selectedServiceIds, menuMap, categoryMap]);

  const totalDuration = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalDuration, 0),
    [groups]
  );

  const totalPrice = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalPrice, 0),
    [groups]
  );

  return { groups, totalDuration, totalPrice };
}
