'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookingStatus } from '@/types';
import type { Booking } from '@/features/bookings/types';
import {
  getDashboardTodayBookings,
  getDashboardMonthlyBookings,
  getDashboardCustomerCount,
} from '../api';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useDashboard(salonId: string) {
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const monthStart = useMemo(() => {
    const now = new Date();
    return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);
  const monthEnd = useMemo(() => {
    const now = new Date();
    return toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }, []);

  // 오늘 전체 예약 (상태별 카운트 + 최근 예약)
  const todayQuery = useQuery({
    queryKey: ['dashboard', 'today', salonId, today],
    queryFn: async () => {
      const res = await getDashboardTodayBookings(salonId, today);
      return (res.data ?? []) as Booking[];
    },
    enabled: !!salonId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  // 이번 달 완료 예약 (매출 + 직원별)
  const monthlyQuery = useQuery({
    queryKey: ['dashboard', 'monthly', salonId, monthStart, monthEnd],
    queryFn: async () => {
      const res = await getDashboardMonthlyBookings(salonId, monthStart, monthEnd);
      return (res.data ?? []) as Booking[];
    },
    enabled: !!salonId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // 전체 고객 수 (경량 카운트 전용 — 고객 피처 모듈 import 없음)
  const customerCountQuery = useQuery({
    queryKey: ['dashboard', 'customerCount', salonId],
    queryFn: async () => {
      const res = await getDashboardCustomerCount(salonId);
      return (res.data as { total: number } | null)?.total ?? 0;
    },
    enabled: !!salonId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const todayBookings = todayQuery.data ?? [];
  const monthlyBookings = monthlyQuery.data ?? [];

  // 오늘 통계
  const todayStats = useMemo(() => ({
    total: todayBookings.length,
    revenue: todayBookings
      .filter((b) => b.status === BookingStatus.COMPLETED)
      .reduce((s, b) => s + (b.price || 0) + (b.productAmount || 0), 0),
    pending: todayBookings.filter(
      (b) => b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED
    ).length,
    completed: todayBookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
    cancelled: todayBookings.filter(
      (b) => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.NO_SHOW
    ).length,
  }), [todayBookings]);

  // 이번 달 총 매출
  const monthlyRevenue = useMemo(
    () => monthlyBookings.reduce((s, b) => s + (b.price || 0) + (b.productAmount || 0), 0),
    [monthlyBookings]
  );

  // 이번 달 상위 직원 top 5
  const topStaff = useMemo(() => {
    const map = new Map<string, { staffId: string; staffName: string; total: number; count: number }>();
    for (const b of monthlyBookings) {
      const prev = map.get(b.staffId) ?? {
        staffId: b.staffId,
        staffName: b.staffName,
        total: 0,
        count: 0,
      };
      map.set(b.staffId, {
        ...prev,
        total: prev.total + (b.price || 0) + (b.productAmount || 0),
        count: prev.count + 1,
      });
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [monthlyBookings]);

  // 오늘 최근 예약 (startTime 내림차순 5개)
  const recentBookings = useMemo(
    () =>
      [...todayBookings]
        .sort((a, b) => (a.startTime > b.startTime ? -1 : 1))
        .slice(0, 5),
    [todayBookings]
  );

  return {
    // 개별 로딩 상태 (섹션별 독립 렌더링용)
    isTodayLoading: todayQuery.isLoading,
    isMonthlyLoading: monthlyQuery.isLoading,
    isCountLoading: customerCountQuery.isLoading,

    todayStats,
    monthlyRevenue,
    totalCustomers: customerCountQuery.data ?? 0,
    topStaff,
    recentBookings,
  };
}
