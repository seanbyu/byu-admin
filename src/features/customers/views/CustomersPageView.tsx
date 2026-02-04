'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { CustomerPageHeader } from '../components/CustomerPageHeader';
import { CustomerCard } from '../components/CustomerCard';
import { CustomerTable } from '../components/CustomerTable';
import { CustomerChartModal } from '../components/CustomerChartModal';
import {
  useCustomerUIStore,
  useCustomerFilters,
  useCustomerModals,
  useViewMode,
  useCustomerUIActions,
} from '../stores/customerStore';
import { customerQueries } from '../hooks/queries';
import type { CustomerListItem, CustomerFilterType } from '../types';

// ============================================
// Helper Functions
// ============================================

// rendering-hoist-jsx: 필터 로직을 외부 함수로 호이스팅
const filterCustomers = (
  customers: CustomerListItem[],
  activeFilter: CustomerFilterType,
  searchQuery: string
): CustomerListItem[] => {
  let filtered = customers;

  // 필터 적용
  if (activeFilter !== 'all') {
    filtered = filtered.filter((customer) => {
      const tags = customer.tags.map((tag) => tag.toLowerCase());
      switch (activeFilter) {
        case 'new':
          return tags.includes('new');
        case 'returning':
          return tags.includes('returning');
        case 'regular':
          return tags.includes('regular');
        case 'dormant':
          return tags.includes('dormant');
        case 'vip':
          return tags.includes('vip');
        default:
          return true;
      }
    });
  }

  // 검색 적용
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((customer) => {
      const name = customer.name?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';
      const email = customer.email?.toLowerCase() || '';
      return name.includes(query) || phone.includes(query) || email.includes(query);
    });
  }

  return filtered;
};

// rendering-hoist-jsx: 정렬 로직을 외부 함수로 호이스팅
const sortCustomers = (
  customers: CustomerListItem[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): CustomerListItem[] => {
  return [...customers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'last_visit':
        const aDate = a.last_visit ? new Date(a.last_visit).getTime() : 0;
        const bDate = b.last_visit ? new Date(b.last_visit).getTime() : 0;
        comparison = aDate - bDate;
        break;
      case 'total_visits':
        comparison = a.total_visits - b.total_visits;
        break;
      case 'total_spent':
        comparison = a.total_spent - b.total_spent;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// ============================================
// Main Component
// ============================================

export default function CustomersPageView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // Zustand store (선택적 구독)
  const { activeFilter, searchQuery, sortBy, sortOrder } = useCustomerFilters();
  const { showChartModal, selectedCustomerId } = useCustomerModals();
  const viewMode = useViewMode();
  const actions = useCustomerUIActions();

  // TanStack Query: 고객 목록 조회
  const { data, isLoading, error } = useQuery(
    customerQueries.list({
      salon_id: salonId,
      // 서버 필터링은 나중에 구현
      // filter: activeFilter,
      // search: searchQuery,
      // sort_by: sortBy,
      // sort_order: sortOrder,
    })
  );

  const customers = data?.customers || [];

  // js-cache-function-results: 필터링/정렬을 메모이제이션
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = filterCustomers(customers, activeFilter, searchQuery);
    return sortCustomers(filtered, sortBy, sortOrder);
  }, [customers, activeFilter, searchQuery, sortBy, sortOrder]);

  // 필터별 카운트 계산 (js-cache-function-results)
  const filterCounts = useMemo(() => {
    const counts = {
      all: customers.length,
      new: 0,
      returning: 0,
      regular: 0,
      dormant: 0,
      vip: 0,
    };

    customers.forEach((customer) => {
      const tags = customer.tags.map((tag) => tag.toLowerCase());
      if (tags.includes('new')) counts.new++;
      if (tags.includes('returning')) counts.returning++;
      if (tags.includes('regular')) counts.regular++;
      if (tags.includes('dormant')) counts.dormant++;
      if (tags.includes('vip')) counts.vip++;
    });

    return counts;
  }, [customers]);

  // advanced-event-handler-refs: 안정적인 이벤트 핸들러
  const handleCustomerClick = useCallback(
    (customerId: string) => {
      actions.openChartModal(customerId);
    },
    [actions]
  );

  const handleCloseChartModal = useCallback(() => {
    actions.closeChartModal();
  }, [actions]);

  // js-early-exit: 로딩 상태 조기 반환
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  // js-early-exit: 에러 상태 조기 반환
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-red-500">
            {t('common.error')}: {error.message}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with tabs, search, and view toggle */}
        <CustomerPageHeader
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          viewMode={viewMode}
          filterCounts={filterCounts}
          onFilterChange={actions.setActiveFilter}
          onSearchChange={actions.setSearchQuery}
          onViewModeChange={actions.setViewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={actions.setSortBy}
          onSortOrderChange={actions.setSortOrder}
        />

        {/* Content */}
        {filteredAndSortedCustomers.length === 0 ? (
          <Card>
            <div className="py-12 text-center text-secondary-500">
              {searchQuery
                ? t('customer.noSearchResults')
                : t('customer.noCustomers')}
            </div>
          </Card>
        ) : (
          <>
            {/* rendering-conditional-render: 뷰 모드에 따라 조건부 렌더링 */}
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onClick={handleCustomerClick}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CustomerTable
                  customers={filteredAndSortedCustomers}
                  onCustomerClick={handleCustomerClick}
                />
              </Card>
            )}
          </>
        )}
      </div>

      {/* Chart Modal - bundle-conditional: 조건부 렌더링 */}
      {showChartModal && selectedCustomerId && (
        <CustomerChartModal
          isOpen={showChartModal}
          customerId={selectedCustomerId}
          salonId={salonId}
          onClose={handleCloseChartModal}
        />
      )}
    </Layout>
  );
}
