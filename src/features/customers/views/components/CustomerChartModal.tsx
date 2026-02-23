'use client';

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Scissors,
  Clock,
  FileText,
} from 'lucide-react';
import { customerQueries } from '../../hooks/queries';
import type { CustomerTag, ServiceHistoryItem } from '../../types';

// ============================================
// Helper Functions
// ============================================

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

// rerender-memo: 통계 카드를 별도 컴포넌트로 분리
const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="bg-secondary-50 rounded-lg p-3 sm:p-4">
      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg">
          <Icon size={18} className="text-primary-600 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] sm:text-xs text-secondary-500 mb-1">{label}</div>
          <div className="text-base sm:text-xl font-bold text-secondary-900 leading-tight">
            {value}
          </div>
          {subtext && (
            <div className="text-[11px] sm:text-xs text-secondary-500 mt-1">
              {subtext}
            </div>
          )}
        </div>
      </div>
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
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex items-start py-2.5 sm:py-3 border-b border-secondary-100 last:border-0 gap-2">
      <div className="flex items-center min-w-[108px] sm:min-w-[140px] text-xs sm:text-sm text-secondary-500">
        <Icon size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
        {label}
      </div>
      <div className="flex-1 text-sm sm:text-base text-secondary-900 font-medium break-words">
        {value}
      </div>
    </div>
  );
});

// rerender-memo: 시술 이력 아이템을 별도 컴포넌트로 분리
const ServiceHistoryCard = memo(function ServiceHistoryCard({
  item,
  t,
}: {
  item: ServiceHistoryItem;
  t: (key: string) => string;
}) {
  return (
    <div className="border border-secondary-200 rounded-lg p-3 sm:p-4 sm:hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-secondary-900 text-sm sm:text-base">
            {item.service.name}
          </h4>
          {item.service.name_en && (
            <p className="text-[11px] sm:text-xs text-secondary-500">{item.service.name_en}</p>
          )}
        </div>
        <div className="text-right">
          <div className="font-bold text-primary-600 text-sm sm:text-base">
            {formatPrice(item.total_price)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-y-1 text-xs sm:text-sm text-secondary-600">
          <Calendar size={14} className="mr-1.5 sm:mr-2 text-secondary-400" />
          <span>{formatDate(new Date(item.booking_date), 'yyyy-MM-dd')}</span>
          <Clock size={14} className="ml-3 sm:ml-4 mr-1.5 sm:mr-2 text-secondary-400" />
          <span>{item.start_time}</span>
        </div>

        <div className="flex items-center text-xs sm:text-sm text-secondary-600">
          <User size={14} className="mr-1.5 sm:mr-2 text-secondary-400" />
          <span>{item.artist.name}</span>
        </div>

        {(item.customer_notes || item.staff_notes) && (
          <div className="mt-3 pt-3 border-t border-secondary-100">
            {item.customer_notes && (
              <div className="mb-2">
                <div className="text-xs text-secondary-500 mb-1">
                  {t('customer.chart.customerNotes')}
                </div>
                <p className="text-xs sm:text-sm text-secondary-700">{item.customer_notes}</p>
              </div>
            )}
            {item.staff_notes && (
              <div>
                <div className="text-xs text-secondary-500 mb-1">
                  {t('customer.chart.staffNotes')}
                </div>
                <p className="text-xs sm:text-sm text-secondary-700">{item.staff_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

interface CustomerChartModalProps {
  isOpen: boolean;
  customerId: string;
  salonId: string;
  onClose: () => void;
}

export const CustomerChartModal = memo(function CustomerChartModal({
  isOpen,
  customerId,
  salonId,
  onClose,
}: CustomerChartModalProps) {
  const t = useTranslations();

  // TanStack Query: 고객 차트 조회
  const { data: chartData, isLoading } = useQuery(
    customerQueries.chart(salonId, customerId)
  );

  const customer = chartData?.customer;
  const stats = chartData?.stats;
  const serviceHistory = chartData?.service_history || [];

  // js-early-exit: 로딩 상태
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('customer.chart.title')} size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Modal>
    );
  }

  // js-early-exit: 데이터 없음
  if (!customer || !stats) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('customer.chart.title')} size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary-500">{t('customer.chart.noData')}</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.chart.title')}
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6 max-h-[78vh] sm:max-h-[80vh] overflow-y-auto px-0 sm:px-1">
        {/* Customer Basic Info */}
        <Card padding="none">
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 leading-tight">
                  {customer.name}
                </h2>
                {customer.customer_type === 'foreign' && (
                  <span className="text-xs sm:text-sm text-secondary-500">
                    {t('customer.type.foreign')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {customer.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={getTagVariant(tag)}
                    size="sm"
                    className="text-[11px] sm:text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-0">
              {customer.phone && (
                <InfoRow icon={Phone} label={t('customer.field.phone')} value={customer.phone} />
              )}
              {customer.email && (
                <InfoRow icon={Mail} label={t('customer.field.email')} value={customer.email} />
              )}
              <InfoRow
                icon={Calendar}
                label={t('customer.field.firstVisit')}
                value={
                  stats.first_visit_date
                    ? formatDate(new Date(stats.first_visit_date), 'yyyy-MM-dd')
                    : '-'
                }
              />
              <InfoRow
                icon={Calendar}
                label={t('customer.field.lastVisit')}
                value={
                  stats.last_visit_date
                    ? formatDate(new Date(stats.last_visit_date), 'yyyy-MM-dd')
                    : '-'
                }
              />
              {customer.notes && (
                <InfoRow
                  icon={FileText}
                  label={t('customer.field.notes')}
                  value={customer.notes}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-secondary-900 mb-3 sm:mb-4">
            {t('customer.chart.statistics')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={TrendingUp}
              label={t('customer.stats.totalVisits')}
              value={stats.total_visits}
            />
            <StatCard
              icon={DollarSign}
              label={t('customer.stats.totalSpent')}
              value={formatPrice(stats.total_spent)}
            />
            <StatCard
              icon={Clock}
              label={t('customer.stats.avgInterval')}
              value={`${Math.round(stats.avg_visit_interval)} ${t('common.days')}`}
            />
            <StatCard
              icon={DollarSign}
              label={t('customer.stats.avgSpending')}
              value={formatPrice(stats.avg_spending_per_visit)}
            />
          </div>
        </div>

        {/* Favorites */}
        {(stats.favorite_service || stats.favorite_artist) && (
          <div>
            <h3 className="text-base sm:text-lg font-bold text-secondary-900 mb-3 sm:mb-4">
              {t('customer.chart.favorites')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {stats.favorite_service && (
                <StatCard
                  icon={Scissors}
                  label={t('customer.stats.favoriteService')}
                  value={stats.favorite_service.name}
                  subtext={`${stats.favorite_service.count} ${t('common.times')}`}
                />
              )}
              {stats.favorite_artist && (
                <StatCard
                  icon={Award}
                  label={t('customer.stats.favoriteArtist')}
                  value={stats.favorite_artist.name}
                  subtext={`${stats.favorite_artist.count} ${t('common.times')}`}
                />
              )}
            </div>
          </div>
        )}

        {/* Service History */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-secondary-900 mb-3 sm:mb-4">
            {t('customer.chart.serviceHistory')}
          </h3>
          {serviceHistory.length === 0 ? (
            <Card padding="none">
              <div className="py-6 sm:py-8 text-sm sm:text-base text-center text-secondary-500">
                {t('customer.chart.noHistory')}
              </div>
            </Card>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {serviceHistory.map((item) => (
                <ServiceHistoryCard key={item.id} item={item} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
});
