'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type {
  CustomerFilterType,
  CustomerSortBy,
} from '../types';

// ============================================
// Customer UI State Store (Zustand)
// - 데이터 fetching은 TanStack Query가 담당
// - UI 상태만 Zustand로 관리 (모달, 필터, 정렬 등)
// - rerender-defer-reads: 콜백에서만 사용하는 상태는 구독하지 않음
// ============================================

interface CustomerUIState {
  // Filters
  activeFilter: CustomerFilterType;
  searchQuery: string;

  // Sort
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';

  // Pagination
  currentPage: number;
  pageSize: number;

  // Selection (for batch operations)
  selectedCustomerIds: Set<string>;

  // Modals
  showChartModal: boolean;
  showEditModal: boolean;
  selectedCustomerId: string | null;
}

interface CustomerUIActions {
  // Filters
  setActiveFilter: (filter: CustomerFilterType) => void;
  setSearchQuery: (query: string) => void;

  // Sort
  setSortBy: (sortBy: CustomerSortBy) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;

  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Selection
  toggleCustomerSelection: (customerId: string) => void;
  selectAllCustomers: (customerIds: string[]) => void;
  clearSelection: () => void;

  // Chart modal
  openChartModal: (customerId: string) => void;
  closeChartModal: () => void;

  // Edit modal
  openEditModal: (customerId: string) => void;
  closeEditModal: () => void;

  // Reset
  reset: () => void;
}

type CustomerUIStore = CustomerUIState & CustomerUIActions;

const initialState: CustomerUIState = {
  activeFilter: 'all',
  searchQuery: '',
  sortBy: 'last_visit',
  sortOrder: 'desc',
  currentPage: 1,
  pageSize: 10,
  selectedCustomerIds: new Set(),
  showChartModal: false,
  showEditModal: false,
  selectedCustomerId: null,
};

export const useCustomerUIStore = create<CustomerUIStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Filter actions
      setActiveFilter: (filter) =>
        set(
          {
            activeFilter: filter,
            // js-early-exit: 필터 변경 시 선택 초기화
            selectedCustomerIds: new Set(),
          },
          false,
          'setActiveFilter'
        ),

      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'setSearchQuery'),

      // Sort actions
      setSortBy: (sortBy) => set({ sortBy }, false, 'setSortBy'),

      setSortOrder: (order) => set({ sortOrder: order }, false, 'setSortOrder'),

      toggleSortOrder: () =>
        set(
          (state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' }),
          false,
          'toggleSortOrder'
        ),

      // Pagination actions
      setCurrentPage: (page) =>
        set({ currentPage: page }, false, 'setCurrentPage'),

      setPageSize: (size) =>
        set({ pageSize: size, currentPage: 1 }, false, 'setPageSize'),

      // Selection actions
      // rerender-functional-setstate: 안정적인 콜백을 위해 함수형 setState 사용
      toggleCustomerSelection: (customerId) =>
        set((state) => {
          const newSet = new Set(state.selectedCustomerIds);
          if (newSet.has(customerId)) {
            newSet.delete(customerId);
          } else {
            newSet.add(customerId);
          }
          return { selectedCustomerIds: newSet };
        }, false, 'toggleCustomerSelection'),

      selectAllCustomers: (customerIds) =>
        set(
          { selectedCustomerIds: new Set(customerIds) },
          false,
          'selectAllCustomers'
        ),

      clearSelection: () =>
        set({ selectedCustomerIds: new Set() }, false, 'clearSelection'),

      // Chart modal actions
      openChartModal: (customerId) =>
        set(
          {
            showChartModal: true,
            selectedCustomerId: customerId,
          },
          false,
          'openChartModal'
        ),

      closeChartModal: () =>
        set(
          {
            showChartModal: false,
            selectedCustomerId: null,
          },
          false,
          'closeChartModal'
        ),

      // Edit modal actions
      openEditModal: (customerId) =>
        set(
          {
            showEditModal: true,
            selectedCustomerId: customerId,
          },
          false,
          'openEditModal'
        ),

      closeEditModal: () =>
        set(
          {
            showEditModal: false,
            selectedCustomerId: null,
          },
          false,
          'closeEditModal'
        ),

      // Reset
      reset: () =>
        set(
          {
            ...initialState,
            selectedCustomerIds: new Set(), // Set은 새로 생성
          },
          false,
          'reset'
        ),
    }),
    { name: 'customer-ui-store' }
  )
);

// ============================================
// Selectors (개별 상태 접근용)
// - rerender-defer-reads: 필요한 상태만 선택적으로 구독
// ============================================

export const selectActiveFilter = (state: CustomerUIStore) => state.activeFilter;
export const selectSearchQuery = (state: CustomerUIStore) => state.searchQuery;
export const selectSortBy = (state: CustomerUIStore) => state.sortBy;
export const selectSortOrder = (state: CustomerUIStore) => state.sortOrder;
export const selectCurrentPage = (state: CustomerUIStore) => state.currentPage;
export const selectPageSize = (state: CustomerUIStore) => state.pageSize;
export const selectSelectedCustomerIds = (state: CustomerUIStore) =>
  state.selectedCustomerIds;
export const selectShowChartModal = (state: CustomerUIStore) => state.showChartModal;
export const selectSelectedCustomerId = (state: CustomerUIStore) =>
  state.selectedCustomerId;

// Actions selector
export const selectCustomerUIActions = (state: CustomerUIStore): CustomerUIActions => ({
  setActiveFilter: state.setActiveFilter,
  setSearchQuery: state.setSearchQuery,
  setSortBy: state.setSortBy,
  setSortOrder: state.setSortOrder,
  toggleSortOrder: state.toggleSortOrder,
  setCurrentPage: state.setCurrentPage,
  setPageSize: state.setPageSize,
  toggleCustomerSelection: state.toggleCustomerSelection,
  selectAllCustomers: state.selectAllCustomers,
  clearSelection: state.clearSelection,
  openChartModal: state.openChartModal,
  closeChartModal: state.closeChartModal,
  openEditModal: state.openEditModal,
  closeEditModal: state.closeEditModal,
  reset: state.reset,
});

// ============================================
// Optimized Hooks (useShallow로 불필요한 리렌더링 방지)
// - rerender-defer-reads 적용
// ============================================

/**
 * 필터 상태만 구독하는 훅
 * @example const { activeFilter, searchQuery } = useCustomerFilters();
 */
export function useCustomerFilters() {
  return useCustomerUIStore(
    useShallow((state) => ({
      activeFilter: state.activeFilter,
      searchQuery: state.searchQuery,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    }))
  );
}

/**
 * 페이지네이션 상태만 구독하는 훅
 * @example const { currentPage, pageSize } = useCustomerPagination();
 */
export function useCustomerPagination() {
  return useCustomerUIStore(
    useShallow((state) => ({
      currentPage: state.currentPage,
      pageSize: state.pageSize,
    }))
  );
}

/**
 * 선택 상태만 구독하는 훅
 * @example const { selectedCustomerIds } = useCustomerSelection();
 */
export function useCustomerSelection() {
  return useCustomerUIStore(
    useShallow((state) => ({
      selectedCustomerIds: state.selectedCustomerIds,
      selectedCount: state.selectedCustomerIds.size,
    }))
  );
}

/**
 * 모달 상태만 구독하는 훅
 * @example const { showChartModal, showEditModal, selectedCustomerId } = useCustomerModals();
 */
export function useCustomerModals() {
  return useCustomerUIStore(
    useShallow((state) => ({
      showChartModal: state.showChartModal,
      showEditModal: state.showEditModal,
      selectedCustomerId: state.selectedCustomerId,
    }))
  );
}

/**
 * 액션만 구독하는 훅 (상태 변경 시 리렌더링 안됨)
 * - advanced-event-handler-refs 패턴과 함께 사용
 * @example const actions = useCustomerUIActions();
 */
export function useCustomerUIActions() {
  return useCustomerUIStore(useShallow(selectCustomerUIActions));
}

/**
 * 차트 모달 열림 상태만 구독
 */
export function useChartModalOpen() {
  return useCustomerUIStore(selectShowChartModal);
}
