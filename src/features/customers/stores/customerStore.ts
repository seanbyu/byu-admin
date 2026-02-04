'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type {
  CustomerViewMode,
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
  // View mode
  viewMode: CustomerViewMode;

  // Filters
  activeFilter: CustomerFilterType;
  searchQuery: string;

  // Sort
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';

  // Selection (for batch operations)
  selectedCustomerIds: Set<string>;

  // Modals
  showChartModal: boolean;
  selectedCustomerId: string | null;
}

interface CustomerUIActions {
  // View mode
  setViewMode: (mode: CustomerViewMode) => void;

  // Filters
  setActiveFilter: (filter: CustomerFilterType) => void;
  setSearchQuery: (query: string) => void;

  // Sort
  setSortBy: (sortBy: CustomerSortBy) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;

  // Selection
  toggleCustomerSelection: (customerId: string) => void;
  selectAllCustomers: (customerIds: string[]) => void;
  clearSelection: () => void;

  // Chart modal
  openChartModal: (customerId: string) => void;
  closeChartModal: () => void;

  // Reset
  reset: () => void;
}

type CustomerUIStore = CustomerUIState & CustomerUIActions;

const initialState: CustomerUIState = {
  viewMode: 'card',
  activeFilter: 'all',
  searchQuery: '',
  sortBy: 'last_visit',
  sortOrder: 'desc',
  selectedCustomerIds: new Set(),
  showChartModal: false,
  selectedCustomerId: null,
};

export const useCustomerUIStore = create<CustomerUIStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // View mode actions
      setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),

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

export const selectViewMode = (state: CustomerUIStore) => state.viewMode;
export const selectActiveFilter = (state: CustomerUIStore) => state.activeFilter;
export const selectSearchQuery = (state: CustomerUIStore) => state.searchQuery;
export const selectSortBy = (state: CustomerUIStore) => state.sortBy;
export const selectSortOrder = (state: CustomerUIStore) => state.sortOrder;
export const selectSelectedCustomerIds = (state: CustomerUIStore) =>
  state.selectedCustomerIds;
export const selectShowChartModal = (state: CustomerUIStore) => state.showChartModal;
export const selectSelectedCustomerId = (state: CustomerUIStore) =>
  state.selectedCustomerId;

// Actions selector
export const selectCustomerUIActions = (state: CustomerUIStore): CustomerUIActions => ({
  setViewMode: state.setViewMode,
  setActiveFilter: state.setActiveFilter,
  setSearchQuery: state.setSearchQuery,
  setSortBy: state.setSortBy,
  setSortOrder: state.setSortOrder,
  toggleSortOrder: state.toggleSortOrder,
  toggleCustomerSelection: state.toggleCustomerSelection,
  selectAllCustomers: state.selectAllCustomers,
  clearSelection: state.clearSelection,
  openChartModal: state.openChartModal,
  closeChartModal: state.closeChartModal,
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
 * @example const { showChartModal, selectedCustomerId } = useCustomerModals();
 */
export function useCustomerModals() {
  return useCustomerUIStore(
    useShallow((state) => ({
      showChartModal: state.showChartModal,
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
 * 뷰 모드만 구독
 */
export function useViewMode() {
  return useCustomerUIStore(selectViewMode);
}

/**
 * 차트 모달 열림 상태만 구독
 */
export function useChartModalOpen() {
  return useCustomerUIStore(selectShowChartModal);
}
