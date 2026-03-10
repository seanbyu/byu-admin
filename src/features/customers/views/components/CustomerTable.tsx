'use client';

import { memo, useMemo, useCallback, useState } from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslations } from 'next-intl';
import { formatDate, formatPrice, formatPhoneDisplay as formatPhoneUtil } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { CustomerListItem, CustomerTag } from '../../types';

// ============================================
// Helper Functions
// ============================================

// rendering-hoist-jsx: 태그 색상 매핑을 외부로 호이스팅
const getTagVariant = (
  tag: CustomerTag
): 'warning' | 'info' | 'success' | 'danger' | 'default' => {
  switch (tag) {
    case 'VIP':
      return 'warning';
    case 'REGULAR':
      return 'success';
    case 'NEW':
      return 'info';
    case 'RETURNING':
      return 'info';
    case 'DORMANT':
      return 'default';
    case 'CHURNED':
      return 'danger';
    default:
      return 'default';
  }
};

// 전화번호 표시 형식 변환 (공통 유틸 사용, null 반환 유지)
const formatPhoneDisplay = (phone: string | undefined): string | null => {
  if (!phone) return null;
  return formatPhoneUtil(phone) || phone;
};

// ============================================
// Sub-Components
// ============================================

// rerender-memo: 태그 렌더링을 별도 컴포넌트로 분리
const CustomerTags = memo(function CustomerTags({ tags }: { tags: CustomerTag[] }) {
  if (tags.length === 0) return <span className="text-secondary-400">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant={getTagVariant(tag)} size="sm">
          {tag}
        </Badge>
      ))}
    </div>
  );
});

const MobileCustomerMeta = memo(function MobileCustomerMeta({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-secondary-500 md:text-[11px]">{label}</p>
      <p className="truncate text-xs font-medium text-secondary-800 md:text-sm">{value}</p>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

interface CustomerTableProps {
  customers: CustomerListItem[];
  onCustomerClick: (customerId: string) => void;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** 수정/등록 권한 */
  canEdit?: boolean;
  /** 삭제 권한 */
  canDelete?: boolean;
  /** 선택된 고객 ID 목록 */
  selectedIds?: string[];
  /** 선택 변경 핸들러 */
  onSelectionChange?: (ids: string[]) => void;
  /** 전체 고객 기준 글로벌 번호 맵 (필터와 무관한 일관된 번호) */
  customerNumberMap?: Map<string, number>;
}

export const CustomerTable = memo(function CustomerTable({
  customers,
  onCustomerClick,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  canEdit = true,
  canDelete = false,
  selectedIds = [],
  onSelectionChange,
  customerNumberMap,
}: CustomerTableProps) {
  const t = useTranslations();
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(new Set());

  // advanced-event-handler-refs: 안정적인 이벤트 핸들러
  // canEdit 권한이 있을 때만 클릭 허용
  const handleRowClick = useCallback(
    (customer: CustomerListItem) => {
      if (canEdit) {
        onCustomerClick(customer.id);
      }
    },
    [onCustomerClick, canEdit]
  );

  // 체크박스: 전체 선택 상태
  const isAllSelected = useMemo(() => {
    if (customers.length === 0) return false;
    return customers.every((c) => selectedIds.includes(c.id));
  }, [customers, selectedIds]);

  // 체크박스: 일부 선택 상태
  const isIndeterminate = useMemo(() => {
    if (customers.length === 0) return false;
    const selectedCount = customers.filter((c) => selectedIds.includes(c.id)).length;
    return selectedCount > 0 && selectedCount < customers.length;
  }, [customers, selectedIds]);

  // 체크박스: 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    if (isAllSelected) {
      // 현재 페이지의 모든 고객을 선택 해제
      const currentPageIds = customers.map((c) => c.id);
      onSelectionChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    } else {
      // 현재 페이지의 모든 고객을 선택
      const currentPageIds = customers.map((c) => c.id);
      const newIds = [...new Set([...selectedIds, ...currentPageIds])];
      onSelectionChange(newIds);
    }
  }, [customers, selectedIds, isAllSelected, onSelectionChange]);

  // 체크박스: 개별 선택/해제
  const handleSelectOne = useCallback(
    (customerId: string, e: React.SyntheticEvent) => {
      e.stopPropagation(); // 행 클릭 이벤트 전파 방지
      if (!onSelectionChange) return;

      if (selectedIds.includes(customerId)) {
        onSelectionChange(selectedIds.filter((id) => id !== customerId));
      } else {
        onSelectionChange([...selectedIds, customerId]);
      }
    },
    [selectedIds, onSelectionChange]
  );

  const handleToggleDetails = useCallback((customerId: string) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  }, []);

  // js-cache-function-results: 컬럼 정의를 메모이제이션
  const columns = useMemo(
    () => [
      // 체크박스 컬럼
      ...(onSelectionChange
        ? [
            {
              key: 'checkbox',
              header: (
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
              ),
              render: (customer: CustomerListItem) => (
                <div
                  className="flex items-center justify-center"
                  onClick={(e) => handleSelectOne(customer.id, e)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(customer.id)}
                    onChange={() => {}} // onClick에서 처리
                    className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
              ),
              width: '50px',
            },
          ]
        : []),
      {
        key: 'customer_number',
        header: t('customer.field.customerNumber'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm font-mono text-secondary-700">
            {customer.customer_number || customerNumberMap?.get(customer.id) || '-'}
          </span>
        ),
      },
      {
        key: 'name',
        header: t('customer.field.name'),
        render: (customer: CustomerListItem) => (
          <div>
            <p className="font-medium text-secondary-900">{customer.name}</p>
            {customer.customer_type === 'foreign' && (
              <span className="text-xs text-secondary-500">
                {t('customer.type.foreign')}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'phone',
        header: t('customer.field.phone'),
        render: (customer: CustomerListItem) => {
          const displayPhone = formatPhoneDisplay(customer.phone);
          return (
            <span className="text-sm text-secondary-700">
              {displayPhone || <span className="text-secondary-400">-</span>}
            </span>
          );
        },
      },
      {
        key: 'line_status',
        header: 'LINE',
        render: (customer: CustomerListItem) => {
          if (!customer.line_user_id) {
            return <span className="text-secondary-300 text-xs">—</span>;
          }
          if (customer.line_blocked) {
            return (
              <Badge variant="danger" size="sm">
                {t('customer.lineBlocked')}
              </Badge>
            );
          }
          return (
            <Badge variant="success" size="sm">
              {t('customer.lineFriend')}
            </Badge>
          );
        },
      },
      {
        key: 'notes',
        header: t('customer.field.notes'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700 truncate max-w-[150px] block">
            {customer.notes || (
              <span className="text-secondary-400">-</span>
            )}
          </span>
        ),
      },
      {
        key: 'last_visit',
        header: t('customer.field.lastVisit'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {customer.last_visit
              ? formatDate(new Date(customer.last_visit), 'yyyy-MM-dd')
              : t('customer.noVisit')}
          </span>
        ),
      },
      {
        key: 'total_visits',
        header: t('customer.field.totalVisits'),
        render: (customer: CustomerListItem) => (
          <span className="font-medium text-primary-600">
            {customer.total_visits}
          </span>
        ),
      },
      {
        key: 'total_spent',
        header: t('customer.field.totalSpent'),
        render: (customer: CustomerListItem) => (
          <span className="font-medium text-primary-600">
            {formatPrice(customer.total_spent)}
          </span>
        ),
      },
      {
        key: 'no_show',
        header: t('customer.field.noShow'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {/* TODO: 노쇼 데이터 추가 필요 */}
            <span className="text-secondary-400">-</span>
          </span>
        ),
      },
      {
        key: 'primary_artist',
        header: t('customer.field.primaryArtist'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {customer.primary_artist?.name || (
              <span className="text-secondary-400">-</span>
            )}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: t('customer.field.createdAt'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {formatDate(new Date(customer.created_at), 'yyyy-MM-dd')}
          </span>
        ),
      },
      {
        key: 'membership',
        header: t('customer.field.membership'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {/* TODO: 정액권 데이터 추가 필요 */}
            <span className="text-secondary-400">-</span>
          </span>
        ),
      },
    ],
    [t, customerNumberMap, onSelectionChange, isAllSelected, isIndeterminate, handleSelectAll, handleSelectOne, selectedIds]
  );

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  // 페이지 번호 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 페이지가 많으면 ... 포함
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
      }

      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Mobile: 카드 리스트 */}
      <div className="md:hidden space-y-3">
        {customers.length === 0 ? (
          <EmptyState message={t('customer.noCustomers')} size="md" bordered />
        ) : (
          customers.map((customer) => {
            const displayPhone = formatPhoneDisplay(customer.phone) ?? '-';
            const customerNumber = customer.customer_number || customerNumberMap?.get(customer.id) || '-';
            const lastVisit = customer.last_visit
              ? formatDate(new Date(customer.last_visit), 'yyyy-MM-dd')
              : t('customer.noVisit');
            const isExpanded = expandedCustomerIds.has(customer.id);

            return (
              <div
                key={customer.id}
                className="rounded-xl border border-secondary-200 bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleRowClick(customer)}
                    className="flex-1 min-w-0 text-left disabled:cursor-default"
                  >
                    <p className="truncate text-sm font-semibold text-secondary-900 min-[360px]:text-base">
                      {customer.name}
                    </p>
                    <p className="mt-0.5 text-xs text-secondary-700 min-[360px]:text-sm">{displayPhone}</p>
                  </button>

                  {onSelectionChange && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onClick={(e) => handleSelectOne(customer.id, e)}
                      onChange={() => {}} // onClick에서 처리
                      className="mt-1 h-5 w-5 rounded border-secondary-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                      aria-label={`${customer.name} ${t('common.select')}`}
                    />
                  )}
                </div>

                <div className="mt-2.5">
                  <MobileCustomerMeta
                    label={t('customer.field.lastVisit')}
                    value={lastVisit}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-secondary-100">
                  <button
                    type="button"
                    onClick={() => handleToggleDetails(customer.id)}
                    className="flex w-full items-center justify-between text-xs font-medium text-primary-600 min-[360px]:text-sm"
                  >
                    <span>
                      {isExpanded
                        ? t('common.actions.hideDetails')
                        : t('common.actions.showDetails')}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 min-[360px]:grid-cols-2">
                    <MobileCustomerMeta
                      label={t('customer.field.customerNumber')}
                      value={customerNumber}
                    />
                    <MobileCustomerMeta
                      label={t('customer.field.primaryArtist')}
                      value={customer.primary_artist?.name || '-'}
                    />
                    <MobileCustomerMeta
                      label={t('customer.field.totalVisits')}
                      value={customer.total_visits}
                    />
                    <MobileCustomerMeta
                      label={t('customer.field.totalSpent')}
                      value={formatPrice(customer.total_spent)}
                    />
                    <MobileCustomerMeta
                      label={t('customer.field.createdAt')}
                      value={formatDate(new Date(customer.created_at), 'yyyy-MM-dd')}
                    />
                    <MobileCustomerMeta
                      label={t('customer.field.notes')}
                      value={customer.notes || '-'}
                    />
                    {customer.customer_type === 'foreign' && (
                      <MobileCustomerMeta
                        label={t('customer.field.customerType')}
                        value={t('customer.type.foreign')}
                      />
                    )}

                    {customer.tags.length > 0 && (
                      <div className="col-span-2 mt-1">
                        <CustomerTags tags={customer.tags} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: 테이블 */}
      <div className="hidden md:block md:[&_th]:px-3 md:[&_th]:py-2.5 md:[&_th]:text-[11px] md:[&_td]:px-3 md:[&_td]:py-3 md:[&_td]:text-sm lg:[&_th]:text-xs xl:[&_th]:px-4 xl:[&_td]:px-4 xl:[&_td]:py-3.5">
        <Table
          data={customers}
          columns={columns}
          onRowClick={canEdit ? handleRowClick : undefined}
          emptyMessage={t('customer.noCustomers')}
        />
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <>
          <div className="hidden items-center justify-between border-t border-secondary-200 px-3 py-3 md:flex xl:px-4">
            {/* Left: Info */}
            <div className="flex items-center space-x-3 xl:space-x-4">
              <span className="text-xs text-secondary-600 lg:text-sm">
                {t('common.pagination.showing', {
                  start: startIndex,
                  end: endIndex,
                  total: totalCount,
                })}
              </span>

              {/* Page size selector */}
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-9 rounded-lg border border-secondary-200 bg-white px-2 text-xs text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:text-sm"
              >
                <option value={10}>10 / {t('common.pagination.page')}</option>
                <option value={20}>20 / {t('common.pagination.page')}</option>
                <option value={50}>50 / {t('common.pagination.page')}</option>
                <option value={100}>100 / {t('common.pagination.page')}</option>
              </select>
            </div>

            {/* Right: Page navigation */}
            <div className="flex items-center space-x-1.5 lg:space-x-2">
              {/* Previous button */}
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 rounded-lg border border-secondary-200 bg-white px-3 text-xs text-secondary-700 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50 lg:text-sm"
              >
                {t('common.pagination.previous')}
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-secondary-400 lg:px-2">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => onPageChange(page as number)}
                      className={`h-9 rounded-lg px-3 text-xs lg:text-sm ${
                        currentPage === page
                          ? 'bg-primary-500 text-white font-medium'
                          : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-200'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              {/* Next button */}
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 rounded-lg border border-secondary-200 bg-white px-3 text-xs text-secondary-700 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50 lg:text-sm"
              >
                {t('common.pagination.next')}
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-secondary-200 px-1 pb-1 pt-3 md:hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-secondary-600">
                {startIndex}-{endIndex} / {totalCount}
              </span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-9 rounded-lg border border-secondary-200 bg-white px-2 text-xs text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={10}>10 / {t('common.pagination.page')}</option>
                <option value={20}>20 / {t('common.pagination.page')}</option>
                <option value={50}>50 / {t('common.pagination.page')}</option>
                <option value={100}>100 / {t('common.pagination.page')}</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 rounded-lg border border-secondary-200 bg-white text-sm text-secondary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('common.pagination.previous')}
              </button>

              <div className="flex h-10 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 text-sm font-medium text-primary-700">
                {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 rounded-lg border border-secondary-200 bg-white text-sm text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.pagination.next')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
