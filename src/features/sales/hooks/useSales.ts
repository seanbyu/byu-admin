'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSalesBookings } from '../api';
import { salesKeys, SALES_QUERY_OPTIONS } from './queries';
import type {
  SalesFilters,
  SalesPreset,
  SalesSummary,
  SalesByPayment,
  SalesByStaff,
  SalesByMenu,
} from '../types';
import type { Booking } from '@/features/bookings/types';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildPresetDates(preset: SalesPreset): { startDate: string; endDate: string } {
  const today = new Date();
  const todayStr = toLocalDateString(today);

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }
  if (preset === 'week') {
    const start = new Date(today);
    const day = today.getDay();
    start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return { startDate: toLocalDateString(start), endDate: todayStr };
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toLocalDateString(start), endDate: todayStr };
  }
  return { startDate: todayStr, endDate: todayStr };
}

const PAYMENT_LABELS: Record<string, string> = {
  CARD: 'CARD',
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
};

export function useSales(salonId: string) {
  const [filters, setFilters] = useState<SalesFilters>(() => {
    const { startDate, endDate } = buildPresetDates('month');
    return { preset: 'month', startDate, endDate };
  });

  const { data, isLoading, error } = useQuery({
    queryKey: salesKeys.list(salonId, filters.startDate, filters.endDate),
    queryFn: async () => {
      const res = await getSalesBookings(salonId, filters.startDate, filters.endDate);
      return (res.data ?? []) as Booking[];
    },
    enabled: !!salonId,
    ...SALES_QUERY_OPTIONS,
  });

  const bookings = data ?? [];

  const summary = useMemo<SalesSummary>(() => ({
    totalRevenue: bookings.reduce((s, b) => s + (b.price || 0) + (b.productAmount || 0), 0),
    serviceRevenue: bookings.reduce((s, b) => s + (b.price || 0), 0),
    productRevenue: bookings.reduce((s, b) => s + (b.productAmount || 0), 0),
    bookingCount: bookings.length,
  }), [bookings]);

  const byPayment = useMemo<SalesByPayment[]>(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const b of bookings) {
      const method = b.paymentMethod || '';
      const label = PAYMENT_LABELS[method] || '미등록';
      const prev = map.get(label) ?? { amount: 0, count: 0 };
      map.set(label, {
        amount: prev.amount + (b.price || 0) + (b.productAmount || 0),
        count: prev.count + 1,
      });
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ method: label, label, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount);
  }, [bookings]);

  const byStaff = useMemo<SalesByStaff[]>(() => {
    const map = new Map<string, SalesByStaff>();
    for (const b of bookings) {
      const prev = map.get(b.staffId) ?? {
        staffId: b.staffId,
        staffName: b.staffName,
        serviceAmount: 0,
        productAmount: 0,
        total: 0,
        count: 0,
      };
      map.set(b.staffId, {
        ...prev,
        serviceAmount: prev.serviceAmount + (b.price || 0),
        productAmount: prev.productAmount + (b.productAmount || 0),
        total: prev.total + (b.price || 0) + (b.productAmount || 0),
        count: prev.count + 1,
      });
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [bookings]);

  const byMenu = useMemo<SalesByMenu[]>(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const b of bookings) {
      const cats = (b.serviceName || '').split(', ').filter(Boolean);
      const perCat = (b.price || 0) / (cats.length || 1);
      for (const cat of cats) {
        const prev = map.get(cat) ?? { amount: 0, count: 0 };
        map.set(cat, { amount: prev.amount + perCat, count: prev.count + 1 });
      }
    }
    return Array.from(map.entries())
      .map(([categoryName, v]) => ({ categoryName, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount);
  }, [bookings]);

  function applyPreset(preset: SalesPreset) {
    if (preset === 'custom') {
      setFilters((prev) => ({ ...prev, preset }));
    } else {
      const { startDate, endDate } = buildPresetDates(preset);
      setFilters({ preset, startDate, endDate });
    }
  }

  function applyCustomRange(startDate: string, endDate: string) {
    setFilters({ preset: 'custom', startDate, endDate });
  }

  return {
    filters,
    applyPreset,
    applyCustomRange,
    bookings,
    isLoading,
    error,
    summary,
    byPayment,
    byStaff,
    byMenu,
  };
}
