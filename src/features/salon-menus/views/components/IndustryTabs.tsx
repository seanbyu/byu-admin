'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { SalonIndustry } from '../../types';

interface IndustryTabsProps {
  selectedTab: string;
  selectedIndustries: SalonIndustry[];
  onSelectTab: (tab: string) => void;
  onAddIndustryClick?: () => void;
  addIndustryLabel?: string;
}

// rendering-hoist-jsx: 정적 클래스명 상수 호이스팅
const BASE_TAB_CLASS = 'px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[11px] sm:text-xs md:text-sm font-medium transition-colors';
const ACTIVE_TAB_CLASS = 'bg-primary-500 text-white';
const INACTIVE_TAB_CLASS = 'bg-white text-secondary-500 border border-secondary-200 hover:bg-secondary-50';

// 개별 탭 버튼 컴포넌트 (rerender-memo)
interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = memo(function TabButton({ id, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BASE_TAB_CLASS} ${isActive ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS} whitespace-nowrap shrink-0`}
    >
      {label}
    </button>
  );
});

// rerender-memo: 탭 컴포넌트 메모이제이션
export const IndustryTabs = memo(function IndustryTabs({
  selectedTab,
  selectedIndustries,
  onSelectTab,
  onAddIndustryClick,
  addIndustryLabel,
}: IndustryTabsProps) {
  const t = useTranslations();
  const addLabel = addIndustryLabel ?? t('menu.addIndustry');

  // 각 탭 클릭 핸들러를 상위에서 생성하지 않고 직접 전달
  const handleAllTabClick = useCallback(() => {
    onSelectTab('all');
  }, [onSelectTab]);

  return (
    <div className="mb-4 md:mb-6 xl:mb-8 overflow-x-auto">
      <div className="flex items-center gap-1.5 md:gap-2 min-w-max pb-1">
        <TabButton
          id="all"
          label={t('common.all')}
          isActive={selectedTab === 'all'}
          onClick={handleAllTabClick}
        />
        {selectedIndustries.map((ind) => (
          <TabButton
            key={ind.id}
            id={ind.id}
            label={ind.name || ''}
            isActive={selectedTab === ind.id}
            onClick={() => onSelectTab(ind.id)}
          />
        ))}
        {onAddIndustryClick && (
          <button
            type="button"
            onClick={onAddIndustryClick}
            className={`${BASE_TAB_CLASS} ${INACTIVE_TAB_CLASS} flex items-center gap-1 whitespace-nowrap shrink-0`}
          >
            <Plus className="w-3 h-3" />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
});

export default IndustryTabs;
