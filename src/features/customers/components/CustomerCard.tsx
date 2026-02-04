'use client';

import { memo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { formatDate, formatPrice } from '@/lib/utils';
import { Calendar, DollarSign, User, Phone, Mail, Tag } from 'lucide-react';
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
  if (tags.length === 0) return null;

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

// rerender-memo: 정보 행을 별도 컴포넌트로 분리
const InfoRow = memo(function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center text-sm text-secondary-600">
      <Icon size={16} className="mr-2 text-secondary-400" />
      <span className="font-medium mr-2">{label}:</span>
      <span>{value}</span>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

interface CustomerCardProps {
  customer: CustomerListItem;
  onClick: (customerId: string) => void;
}

export const CustomerCard = memo(function CustomerCard({
  customer,
  onClick,
}: CustomerCardProps) {
  const t = useTranslations();

  // advanced-event-handler-refs: 안정적인 이벤트 핸들러
  const handleClick = useCallback(() => {
    onClick(customer.id);
  }, [customer.id, onClick]);

  const lastVisitText = customer.last_visit
    ? formatDate(new Date(customer.last_visit), 'yyyy-MM-dd')
    : t('customer.noVisit');

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleClick}
    >
      <div className="space-y-4">
        {/* Header: Name and Tags */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-secondary-900">
              {customer.name}
            </h3>
            {customer.customer_type === 'foreign' && (
              <span className="text-xs text-secondary-500">
                {t('customer.type.foreign')}
              </span>
            )}
          </div>
          <CustomerTags tags={customer.tags} />
        </div>

        {/* Contact Info */}
        {(customer.phone || customer.email) && (
          <div className="space-y-1">
            {customer.phone && (
              <div className="flex items-center text-sm text-secondary-600">
                <Phone size={14} className="mr-2 text-secondary-400" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center text-sm text-secondary-600">
                <Mail size={14} className="mr-2 text-secondary-400" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-secondary-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {customer.total_visits}
            </div>
            <div className="text-xs text-secondary-500">
              {t('customer.stats.visits')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {formatPrice(customer.total_spent)}
            </div>
            <div className="text-xs text-secondary-500">
              {t('customer.stats.spent')}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 pt-3 border-t border-secondary-100">
          <InfoRow
            icon={Calendar}
            label={t('customer.lastVisit')}
            value={lastVisitText}
          />
          {customer.primary_artist && (
            <InfoRow
              icon={User}
              label={t('customer.primaryArtist')}
              value={customer.primary_artist.name}
            />
          )}
          {customer.favorite_service && (
            <InfoRow
              icon={Tag}
              label={t('customer.favoriteService')}
              value={customer.favorite_service.name}
            />
          )}
        </div>

        {/* Latest Booking */}
        {customer.latest_booking && (
          <div className="pt-3 border-t border-secondary-100">
            <div className="text-xs text-secondary-500 mb-1">
              {t('customer.latestBooking')}
            </div>
            <div className="text-sm">
              <span className="font-medium">{customer.latest_booking.service_name}</span>
              <span className="text-secondary-500"> · </span>
              <span className="text-secondary-600">
                {formatDate(
                  new Date(customer.latest_booking.booking_date),
                  'yyyy-MM-dd'
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
