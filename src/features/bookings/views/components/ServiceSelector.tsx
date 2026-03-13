'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useCategories, useMenus } from '@/features/salon-menus/hooks/useSalonMenus';
import { cn } from '@/lib/utils';

interface ServiceSelectorProps {
  salonId: string;
  selectedServiceIds: string[];
  onServiceAdd: (serviceId: string) => void;
  isLoading?: boolean;
}

function ServiceSelectorComponent({
  salonId,
  selectedServiceIds,
  onServiceAdd,
}: ServiceSelectorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // 카테고리 데이터 가져오기
  const { categories, isLoading: isCategoriesLoading } = useCategories(salonId);

  // 메뉴 데이터 가져오기
  const { menus, isLoading: isMenusLoading } = useMenus(salonId, undefined, {
    enabled: !!salonId,
  });

  // 카테고리별 메뉴 그룹화
  const menusByCategory = useMemo(() => {
    if (!menus || menus.length === 0) return {};
    return menus
      .filter((menu) => menu.is_active)
      .reduce((acc, menu) => {
        const categoryId = menu.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(menu);
        return acc;
      }, {} as Record<string, typeof menus>);
  }, [menus]);

  // 메뉴가 있는 카테고리만 필터링
  const visibleCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => menusByCategory[cat.id]?.length > 0);
  }, [categories, menusByCategory]);

  // 첫 번째 카테고리 자동 선택
  useMemo(() => {
    if (!selectedCategoryId && visibleCategories.length > 0) {
      setSelectedCategoryId(visibleCategories[0].id);
    }
  }, [visibleCategories, selectedCategoryId]);

  // 현재 선택된 카테고리의 메뉴 목록
  const currentMenus = useMemo(() => {
    if (!selectedCategoryId) return [];
    return menusByCategory[selectedCategoryId] || [];
  }, [selectedCategoryId, menusByCategory]);

  // 카테고리 선택 핸들러
  const handleCategoryClick = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  // 서비스 선택 핸들러
  const handleServiceClick = useCallback((serviceId: string) => {
    onServiceAdd(serviceId);
  }, [onServiceAdd]);

  const selectedCounts = useMemo(
    () =>
      selectedServiceIds.reduce<Record<string, number>>((acc, serviceId) => {
        acc[serviceId] = (acc[serviceId] || 0) + 1;
        return acc;
      }, {}),
    [selectedServiceIds]
  );

  if (isCategoriesLoading || isMenusLoading) {
    return (
      <div className="border border-secondary-200 rounded-lg p-4 text-center text-secondary-600 bg-white">
        Loading...
      </div>
    );
  }

  if (visibleCategories.length === 0) {
    return (
      <div className="border border-secondary-200 rounded-lg p-4 text-center text-secondary-600 bg-white">
        등록된 서비스가 없습니다
      </div>
    );
  }

  return (
    <div className="border border-secondary-200 rounded-lg overflow-hidden bg-white">
      <div className="flex h-[180px] sm:h-[240px]">
        {/* 카테고리 목록 (왼쪽) */}
        <div className="w-1/3 border-r border-secondary-200 overflow-y-auto bg-secondary-50">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                'w-full px-2 py-2 text-left text-xs font-medium transition-colors border-l-2 sm:px-4 sm:py-3 sm:text-sm',
                selectedCategoryId === category.id
                  ? 'bg-primary-100 text-primary-700 border-l-primary-500'
                  : 'bg-white text-secondary-800 border-l-transparent hover:bg-secondary-50'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 서비스 목록 (오른쪽) */}
        <div className="w-2/3 overflow-y-auto">
          {currentMenus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => handleServiceClick(menu.id)}
              className={cn(
                'w-full px-2 py-2 text-left border-b border-secondary-100 last:border-b-0 transition-colors sm:px-4 sm:py-3',
                (selectedCounts[menu.id] || 0) > 0
                  ? 'bg-primary-100'
                  : 'hover:bg-secondary-50'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'text-xs font-medium sm:text-sm',
                    (selectedCounts[menu.id] || 0) > 0
                      ? 'text-primary-700'
                      : 'text-secondary-800'
                  )}
                >
                  {menu.name}
                </span>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  {(selectedCounts[menu.id] || 0) > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-xs">
                      x{selectedCounts[menu.id]}
                    </span>
                  )}
                  <span className="text-[10px] text-secondary-600 sm:text-xs">
                    {menu.duration_minutes ?? 0}min / ฿{(menu.base_price || menu.price || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ServiceSelector = memo(ServiceSelectorComponent);
export default ServiceSelector;
