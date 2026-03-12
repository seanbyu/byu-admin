'use client';

import { Card } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { useUser } from '@/features/auth/hooks/useAuth';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';

export default function DashboardPage() {
  const t = useTranslations();
  const { data: user } = useUser();
  const { user: authUser } = useAuthStore();
  const salonId = authUser?.salonId || '';

  const {
    isLoading,
    todayStats,
    monthlyRevenue,
    totalCustomers,
    topStaff,
    recentBookings,
  } = useDashboard(salonId);

  const statCards = [
    {
      title: t('common.dashboard.todayBookings'),
      value: todayStats.total,
      icon: Calendar,
      color: 'text-info-600',
      bgColor: 'bg-info-50',
    },
    {
      title: t('common.dashboard.todayRevenue'),
      value: formatPrice(todayStats.revenue),
      icon: DollarSign,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: t('common.dashboard.totalCustomers'),
      value: totalCustomers,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: t('common.dashboard.monthlyRevenue'),
      value: formatPrice(monthlyRevenue),
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ];

  const bookingStats = [
    {
      title: t('common.dashboard.pending'),
      value: todayStats.pending,
      icon: Clock,
      color: 'text-warning-600',
    },
    {
      title: t('common.dashboard.completed'),
      value: todayStats.completed,
      icon: CheckCircle,
      color: 'text-success-600',
    },
    {
      title: t('common.dashboard.cancelled'),
      value: todayStats.cancelled,
      icon: XCircle,
      color: 'text-error-600',
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-h1">
          {t('nav.dashboard')}
        </h1>
        <p className="text-body mt-1">
          {t('common.dashboard.welcome', { name: user?.name || '' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body mb-1">{stat.title}</p>
                  <p className="text-h2">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Booking Status (오늘 기준) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {bookingStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center">
                <Icon className={`w-5 h-5 sm:w-8 sm:h-8 ${stat.color} mr-3 sm:mr-4`} />
                <div>
                  <p className="text-body">{stat.title}</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {stat.value} {t('common.dashboard.cases')}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘 최근 예약 */}
        <Card className="h-full">
          <h3 className="text-h4 mb-3">
            {t('common.dashboard.recentBookings')}
          </h3>
          {recentBookings.length === 0 ? (
            <EmptyState message={t('booking.noBookings')} size="sm" />
          ) : (
            <div className="space-y-0">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0"
                >
                  <div>
                    <p className="text-base font-medium text-secondary-900">{booking.customerName}</p>
                    <p className="text-sm text-secondary-500">
                      {booking.serviceName} · {booking.staffName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-900">{booking.startTime}</p>
                    <p className="text-xs text-secondary-500">{t('common.dashboard.today')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 이번 달 상위 직원 */}
        <Card className="h-full">
          <h3 className="text-h4 mb-3">
            {t('common.dashboard.topStaffThisMonth')}
          </h3>
          {topStaff.length === 0 ? (
            <EmptyState message={t('common.noData')} size="sm" />
          ) : (
            <div className="space-y-0">
              {topStaff.map((staff, index) => (
                <div
                  key={staff.staffId}
                  className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3 shrink-0">
                      <span className="text-sm font-semibold text-primary-700">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-base font-medium text-secondary-900">{staff.staffName}</p>
                      <p className="text-sm text-secondary-500">
                        {staff.count} {t('common.dashboard.cases')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-secondary-900">
                    {formatPrice(staff.total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
