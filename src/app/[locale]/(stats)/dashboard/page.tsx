'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
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

interface Stats {
  todayBookings: number;
  todayRevenue: number;
  totalCustomers: number;
  monthlyRevenue: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export default function DashboardPage() {
  const t = useTranslations();
  const { data: user, isLoading } = useUser();
  // const { user } = useAuthStore(); // Replaced by useUser
  const [stats, setStats] = useState<Stats>({
    todayBookings: 12,
    todayRevenue: 45000,
    totalCustomers: 358,
    monthlyRevenue: 1250000,
    pendingBookings: 5,
    completedBookings: 234,
    cancelledBookings: 12,
  });

  const statCards = [
    {
      title: '오늘 예약',
      value: stats.todayBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '오늘 매출',
      value: formatPrice(stats.todayRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '총 고객',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '월 매출',
      value: formatPrice(stats.monthlyRevenue),
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ];

  const bookingStats = [
    {
      title: '대기 중',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: '완료',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: '취소',
      value: stats.cancelledBookings,
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {t('nav.dashboard')}
          </h1>
          <p className="text-secondary-600 mt-1">환영합니다, {user?.name}님!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Booking Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {bookingStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <div className="flex items-center">
                  <Icon className={`w-8 h-8 ${stat.color} mr-4`} />
                  <div>
                    <p className="text-sm text-secondary-600">{stat.title}</p>
                    <p className="text-xl font-bold text-secondary-900">
                      {stat.value}건
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card title="최근 예약" className="h-full">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-secondary-900">
                      홍길동 고객
                    </p>
                    <p className="text-sm text-secondary-600">
                      커트 · 김철수 직원
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-900">
                      14:00
                    </p>
                    <p className="text-xs text-secondary-600">오늘</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Staff */}
          <Card title="이번 달 TOP 직원" className="h-full">
            <div className="space-y-4">
              {[
                { name: '김철수', bookings: 45, revenue: 3500000 },
                { name: '이영희', bookings: 42, revenue: 3200000 },
                { name: '박민수', bookings: 38, revenue: 2900000 },
                { name: '정수진', bookings: 35, revenue: 2700000 },
                { name: '최지훈', bookings: 32, revenue: 2500000 },
              ].map((designer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-primary-700">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {designer.name}
                      </p>
                      <p className="text-sm text-secondary-600">
                        {designer.bookings}건
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-900">
                      {formatPrice(designer.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
