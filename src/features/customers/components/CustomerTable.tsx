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
}

export const CustomerTable = memo(function CustomerTable({
  customers,
  onCustomerClick,
}: CustomerTableProps) {
  const t = useTranslations();

  // advanced-event-handler-refs: 안정적인 이벤트 핸들러
  const handleRowClick = useCallback(
    (customer: CustomerListItem) => {
      onCustomerClick(customer.id);
    },
    [onCustomerClick]
  );

  // js-cache-function-results: 컬럼 정의를 메모이제이션
  const columns = useMemo(
    () => [
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
        key: 'contact',
        header: t('customer.field.contact'),
        render: (customer: CustomerListItem) => (
          <div className="text-sm">
            {customer.phone && (
              <p className="text-secondary-700">{customer.phone}</p>
            )}
            {customer.email && (
              <p className="text-secondary-500 text-xs truncate max-w-[200px]">
                {customer.email}
              </p>
            )}
            {!customer.phone && !customer.email && (
              <span className="text-secondary-400">-</span>
            )}
          </div>
        ),
      },
      {
        key: 'tags',
        header: t('customer.field.tags'),
        render: (customer: CustomerListItem) => (
          <CustomerTags tags={customer.tags} />
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
        key: 'favorite_service',
        header: t('customer.field.favoriteService'),
        render: (customer: CustomerListItem) => (
          <span className="text-sm text-secondary-700">
            {customer.favorite_service?.name || (
              <span className="text-secondary-400">-</span>
            )}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <Table
      data={customers}
      columns={columns}
      onRowClick={handleRowClick}
      emptyMessage={t('customer.noCustomers')}
    />
  );
});
