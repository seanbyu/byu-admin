'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, ArrowUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type {
  CustomerFilterType,
  CustomerSortBy,
} from '../types';

// ============================================
// Filter Tab Component
// ============================================

interface FilterTab {
  type: CustomerFilterType;
  label: string;
  count: number;
}

// rerender-memo: 필터 탭을 별도 컴포넌트로 분리
const FilterTabs = memo(function FilterTabs({
  tabs,
  activeFilter,
  onFilterChange,
}: {
  tabs: FilterTab[];
  activeFilter: CustomerFilterType;
  onFilterChange: (filter: CustomerFilterType) => void;
}) {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.type}
          type="button"
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeFilter === tab.type
              ? 'bg-primary-500 text-white'
              : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
          }`}
          onClick={() => onFilterChange(tab.type)}
        >
          {tab.label}
          <span className="ml-2 text-sm opacity-75">({tab.count})</span>
        </button>
      ))}
    </div>
  );
});

// ============================================
// Sort Dropdown Component
// ============================================

const SortDropdown = memo(function SortDropdown({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  t,
}: {
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: CustomerSortBy) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  t: (key: string) => string;
}) {
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortByChange(e.target.value as CustomerSortBy);
    },
    [onSortByChange]
  );

  const handleToggleOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  return (
    <div className="flex items-center space-x-2">
      <select
        value={sortBy}
        onChange={handleSortChange}
        className="px-3 py-2 border border-secondary-200 rounded-lg bg-white text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="last_visit">{t('customer.sort.lastVisit')}</option>
        <option value="total_visits">{t('customer.sort.totalVisits')}</option>
        <option value="total_spent">{t('customer.sort.totalSpent')}</option>
        <option value="name">{t('customer.sort.name')}</option>
        <option value="created_at">{t('customer.sort.createdAt')}</option>
      </select>
      <button
        type="button"
        className={`p-2 border border-secondary-200 rounded-lg bg-white text-secondary-700 hover:bg-secondary-50 transition-transform ${
          sortOrder === 'desc' ? 'rotate-180' : ''
        }`}
        onClick={handleToggleOrder}
        title={sortOrder === 'asc' ? t('common.sort.asc') : t('common.sort.desc')}
      >
        <ArrowUpDown size={18} />
      </button>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

interface CustomerPageHeaderProps {
  activeFilter: CustomerFilterType;
  searchQuery: string;
  filterCounts: Record<CustomerFilterType, number>;
  onFilterChange: (filter: CustomerFilterType) => void;
  onSearchChange: (query: string) => void;
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: CustomerSortBy) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onAddCustomer: () => void;
  /** 고객 등록 권한 */
  canAddCustomer?: boolean;
}

export const CustomerPageHeader = memo(function CustomerPageHeader({
  activeFilter,
  searchQuery,
  filterCounts,
  onFilterChange,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onAddCustomer,
  canAddCustomer = true,
}: CustomerPageHeaderProps) {
  const t = useTranslations();

  // advanced-event-handler-refs: 안정적인 이벤트 핸들러
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  // rendering-hoist-jsx: 필터 탭 데이터를 메모이제이션
  const filterTabs: FilterTab[] = [
    { type: 'all', label: t('customer.filter.all'), count: filterCounts.all },
    { type: 'new', label: t('customer.filter.new'), count: filterCounts.new },
    {
      type: 'returning',
      label: t('customer.filter.returning'),
      count: filterCounts.returning,
    },
    {
      type: 'regular',
      label: t('customer.filter.regular'),
      count: filterCounts.regular,
    },
    {
      type: 'dormant',
      label: t('customer.filter.dormant'),
      count: filterCounts.dormant,
    },
    { type: 'vip', label: t('customer.filter.vip'), count: filterCounts.vip },
  ];

  return (
    <div className="space-y-4">
      {/* Title and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {t('customer.title')}
          </h1>
          <p className="text-secondary-600 mt-1">
            {t('customer.pageDescription')}
          </p>
        </div>
        {canAddCustomer && (
          <Button onClick={onAddCustomer} className="flex items-center space-x-2">
            <Plus size={20} />
            <span>{t('customer.addNew')}</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        tabs={filterTabs}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />

      {/* Search and Sort */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400"
              size={20}
            />
            <input
              type="text"
              placeholder={t('customer.search.placeholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <SortDropdown
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={onSortByChange}
          onSortOrderChange={onSortOrderChange}
          t={t}
        />
      </div>
    </div>
  );
});
