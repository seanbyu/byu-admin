'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePermission, PermissionModules } from '@/hooks/usePermission';
import { CustomerPageHeader } from './components/CustomerPageHeader';
import { CustomerTable } from './components/CustomerTable';
import { CustomerChartModal } from './components/CustomerChartModal';
import { CreateCustomerModal } from './components/CreateCustomerModal';
import { FilterSettingsModal } from './components/FilterSettingsModal';
import {
  useCustomerFilters as useCustomerFilterState,
  useCustomerModals,
  useCustomerPagination,
  useCustomerSelection,
  useCustomerUIActions,
} from '../stores/customerStore';
import { useCustomerFilters as useCustomerFiltersApi } from '../hooks/useCustomerFilters';
import { customerQueries } from '../hooks/queries';
import type { CustomerListItem, CustomerFilterType, CustomerBaseFilterType } from '../types';
import { isArtistFilter, getArtistIdFromFilter } from '../types';
import type { ArtistFilterTab } from './components/CustomerPageHeader';
import type { CustomFilter } from '../types/filter.types';
import {
  createFilterFunction,
  findFilterByKey,
  calculateFilterCounts as calculateCustomFilterCounts,
} from '../utils/filterUtils';

// ============================================
// Helper Functions
// ============================================

// rendering-hoist-jsx: 필터 로직을 외부 함수로 호이스팅
const filterCustomersWithCustomFilters = (
  customers: CustomerListItem[],
  activeFilter: CustomerFilterType,
  searchQuery: string,
  customFilters: CustomFilter[]
): CustomerListItem[] => {
  let filtered = customers;

  // 필터 적용
  if (activeFilter !== 'all') {
    // 담당자 필터인 경우
    if (isArtistFilter(activeFilter)) {
      const artistId = getArtistIdFromFilter(activeFilter);
      filtered = filtered.filter((customer) => {
        return customer.primary_artist_id === artistId;
      });
    } else {
      // 커스텀 필터 확인
      const customFilter = findFilterByKey(customFilters, activeFilter);
      if (customFilter && customFilter.conditions.length > 0) {
        // 커스텀 필터 조건 적용
        const filterFn = createFilterFunction(customFilter);
        filtered = filtered.filter(filterFn);
      } else {
        // 기본 태그 필터인 경우
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
            case 'foreign':
              return customer.customer_type === 'foreign';
            default:
              return true;
          }
        });
      }
    }
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
  const router = useRouter();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // 권한 체크
  const { canWrite, canDelete } = usePermission();
  const canEditCustomer = canWrite(PermissionModules.CUSTOMERS);
  const canDeleteCustomer = canDelete(PermissionModules.CUSTOMERS);

  // Zustand store (선택적 구독)
  const { activeFilter, searchQuery, sortBy, sortOrder } = useCustomerFilterState();
  const { showChartModal, showCreateModal, selectedCustomerId } = useCustomerModals();
  const { currentPage, pageSize } = useCustomerPagination();
  const { selectedCustomerIds } = useCustomerSelection();
  const actions = useCustomerUIActions();

  // 필터 설정 모달 상태
  const [showFilterSettingsModal, setShowFilterSettingsModal] = useState(false);

  // 커스텀 필터 조회
  const { filters: customFilters = [] } = useCustomerFiltersApi(salonId);

  // 선택된 고객 ID를 배열로 변환
  const selectedIdsArray = useMemo(() => Array.from(selectedCustomerIds), [selectedCustomerIds]);

  // 선택 변경 핸들러
  const handleSelectionChange = useCallback((ids: string[]) => {
    actions.setSelectedCustomerIds(ids);
  }, [actions]);

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

  // 전체 고객 글로벌 번호 맵 (생성순 기준, 필터/정렬과 무관하게 일관된 번호)
  const customerNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...customers].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    sorted.forEach((customer, index) => {
      map.set(customer.id, index + 1);
    });
    return map;
  }, [customers]);

  // js-cache-function-results: 필터링/정렬/페이징을 메모이제이션
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = filterCustomersWithCustomFilters(customers, activeFilter, searchQuery, customFilters);
    return sortCustomers(filtered, sortBy, sortOrder);
  }, [customers, activeFilter, searchQuery, sortBy, sortOrder, customFilters]);

  // 페이지네이션 적용
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedCustomers.slice(startIndex, endIndex);
  }, [filteredAndSortedCustomers, currentPage, pageSize]);

  const totalCount = filteredAndSortedCustomers.length;

  // 필터별 카운트 계산 (js-cache-function-results)
  const filterCounts = useMemo((): Record<CustomerBaseFilterType, number> => {
    const counts = {
      all: customers.length,
      new: 0,
      returning: 0,
      regular: 0,
      dormant: 0,
      vip: 0,
      foreign: 0,
    };

    customers.forEach((customer) => {
      const tags = customer.tags.map((tag) => tag.toLowerCase());
      if (tags.includes('new')) counts.new++;
      if (tags.includes('returning')) counts.returning++;
      if (tags.includes('regular')) counts.regular++;
      if (tags.includes('dormant')) counts.dormant++;
      if (tags.includes('vip')) counts.vip++;
      if (customer.customer_type === 'foreign') counts.foreign++;
    });

    return counts;
  }, [customers]);

  // 커스텀 필터 카운트 계산
  const customFilterCounts = useMemo(() => {
    return calculateCustomFilterCounts(customers, customFilters);
  }, [customers, customFilters]);

  // 담당자별 필터 계산 (고객에게 할당된 담당자만 표시)
  const artistFilters = useMemo((): ArtistFilterTab[] => {
    const artistMap = new Map<string, { name: string; count: number }>();

    customers.forEach((customer) => {
      if (customer.primary_artist_id && customer.primary_artist?.name) {
        const existing = artistMap.get(customer.primary_artist_id);
        if (existing) {
          existing.count++;
        } else {
          artistMap.set(customer.primary_artist_id, {
            name: customer.primary_artist.name,
            count: 1,
          });
        }
      }
    });

    // Map을 배열로 변환하고 이름순으로 정렬
    return Array.from(artistMap.entries())
      .map(([artistId, data]) => ({
        artistId,
        artistName: data.name,
        count: data.count,
      }))
      .sort((a, b) => a.artistName.localeCompare(b.artistName));
  }, [customers]);

  // 고객 클릭 → 상세 페이지로 이동 (고객번호로 라우팅)
  const handleCustomerClick = useCallback(
    (customerId: string) => {
      const customer = customers.find((c) => c.id === customerId);
      const dest = customer?.customer_number ?? customerId;
      router.push(`/customers/detail/${dest}`);
    },
    [router, customers]
  );

  const handleCloseChartModal = useCallback(() => {
    actions.closeChartModal();
  }, [actions]);

  const handleAddCustomer = useCallback(() => {
    actions.openCreateModal();
  }, [actions]);

  const handleCloseCreateModal = useCallback(() => {
    actions.closeCreateModal();
  }, [actions]);

  const handleOpenFilterSettings = useCallback(() => {
    setShowFilterSettingsModal(true);
  }, []);

  const handleCloseFilterSettings = useCallback(() => {
    setShowFilterSettingsModal(false);
  }, []);

  // js-early-exit: 로딩 상태 조기 반환
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Spinner size="xl" />
      </div>
    );
  }

  // js-early-exit: 에러 상태 조기 반환
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-error-500">
          {t('common.error')}: {error.message}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {/* Header with tabs, search, and view toggle */}
        <CustomerPageHeader
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          filterCounts={filterCounts}
          artistFilters={artistFilters}
          onFilterChange={actions.setActiveFilter}
          onSearchChange={actions.setSearchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={actions.setSortBy}
          onSortOrderChange={actions.setSortOrder}
          onAddCustomer={handleAddCustomer}
          canAddCustomer={canEditCustomer}
          customFilters={customFilters}
          customFilterCounts={customFilterCounts}
          onOpenFilterSettings={handleOpenFilterSettings}
        />

        {/* Content */}
        <Card padding="sm" className="rounded-xl">
          <CustomerTable
            customers={paginatedCustomers}
            onCustomerClick={handleCustomerClick}
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={actions.setCurrentPage}
            onPageSizeChange={actions.setPageSize}
            canEdit={canEditCustomer}
            canDelete={canDeleteCustomer}
            selectedIds={selectedIdsArray}
            onSelectionChange={handleSelectionChange}
            customerNumberMap={customerNumberMap}
          />
        </Card>
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

      {/* Create Customer Modal */}
      {showCreateModal && (
        <CreateCustomerModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
        />
      )}

      {/* Filter Settings Modal */}
      {showFilterSettingsModal && (
        <FilterSettingsModal
          isOpen={showFilterSettingsModal}
          onClose={handleCloseFilterSettings}
          salonId={salonId}
        />
      )}
    </>
  );
}
