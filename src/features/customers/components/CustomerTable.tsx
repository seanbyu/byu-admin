'use client';

import { memo, useMemo, useCallback } from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { formatDate, formatPrice } from '@/lib/utils';
import type { CustomerListItem, CustomerTag } from '../types';

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
}: CustomerTableProps) {
  const t = useTranslations();

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

  // 페이지네이션을 고려한 시작 번호
  const startNumber = (currentPage - 1) * pageSize;

  // js-cache-function-results: 컬럼 정의를 메모이제이션
  const columns = useMemo(
    () => [
      {
        key: 'customer_number',
        header: t('customer.field.customerNumber'),
        render: (_customer: CustomerListItem, index: number) => (
          <span className="text-sm font-mono text-secondary-700">
            {startNumber + index + 1}
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
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {customer.phone || (
              <span className="text-secondary-400">-</span>
            )}
          </span>
        ),
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
    [t, startNumber]
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
    <div className="space-y-4">
      <Table
        data={customers}
        columns={columns}
        onRowClick={canEdit ? handleRowClick : undefined}
        emptyMessage={t('customer.noCustomers')}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-200">
          {/* Left: Info */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary-600">
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
              className="px-2 py-1 text-sm border border-secondary-200 rounded-lg bg-white text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={10}>10 / {t('common.pagination.page')}</option>
              <option value={20}>20 / {t('common.pagination.page')}</option>
              <option value={50}>50 / {t('common.pagination.page')}</option>
              <option value={100}>100 / {t('common.pagination.page')}</option>
            </select>
          </div>

          {/* Right: Page navigation */}
          <div className="flex items-center space-x-2">
            {/* Previous button */}
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-secondary-200 rounded-lg bg-white text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.pagination.previous')}
            </button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-secondary-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page as number)}
                    className={`px-3 py-1 text-sm rounded-lg ${
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
              className="px-3 py-1 text-sm border border-secondary-200 rounded-lg bg-white text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
