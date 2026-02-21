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
      <div className="flex h-[240px]">
        {/* 카테고리 목록 (왼쪽) */}
        <div className="w-1/3 border-r border-secondary-200 overflow-y-auto bg-[#F8FAFC]">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                'w-full px-4 py-3 text-left text-sm font-medium transition-colors border-l-2',
                selectedCategoryId === category.id
                  ? 'bg-[#DBEAFE] text-[#1E40AF] border-l-[#3B82F6]'
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
                'w-full px-4 py-3 text-left border-b border-secondary-100 last:border-b-0 transition-colors',
                (selectedCounts[menu.id] || 0) > 0
                  ? 'bg-[#DBEAFE]'
                  : 'hover:bg-secondary-50'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm font-medium',
                    (selectedCounts[menu.id] || 0) > 0
                      ? 'text-[#1E40AF]'
                      : 'text-secondary-800'
                  )}
                >
                  {menu.name}
                </span>
                <div className="flex items-center gap-2">
                  {(selectedCounts[menu.id] || 0) > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3B82F6] px-1.5 text-[10px] font-semibold text-white">
                      x{selectedCounts[menu.id]}
                    </span>
                  )}
                  <span className="text-xs text-secondary-600">
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
