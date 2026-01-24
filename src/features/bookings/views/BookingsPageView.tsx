'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { useTranslations } from 'next-intl';
import { BookingStatus } from '@/types';
import { Booking } from '../types';
import { useBookings } from '../hooks/useBookings';
import { useStaff } from '../../staff/hooks/useStaff';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatPrice } from '@/lib/utils';
import { Plus, Calendar as CalendarIcon, Filter, List } from 'lucide-react';

export default function BookingsPageView() {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // Use new hook
  const { data: response, isLoading } = useBookings(salonId, {
    enabled: !!salonId,
  });

  const { data: staffResponse } = useStaff(salonId, {
    enabled: !!salonId,
  });

  const staffMembers = staffResponse?.data || [];
  const designers = staffMembers
    .filter((staff) => staff.isBookingEnabled)
    .map((staff) => ({
      value: staff.id,
      label: staff.name,
    }));

  const bookings = response || [];

  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const getStatusBadge = (status: BookingStatus) => {
    const statusConfig = {
      [BookingStatus.PENDING]: {
        variant: 'warning' as const,
        label: t('booking.pending'),
      },
      [BookingStatus.CONFIRMED]: {
        variant: 'info' as const,
        label: t('booking.confirmed'),
      },
      [BookingStatus.COMPLETED]: {
        variant: 'success' as const,
        label: t('booking.completed'),
      },
      [BookingStatus.CANCELLED]: {
        variant: 'danger' as const,
        label: t('booking.cancelled'),
      },
      [BookingStatus.NO_SHOW]: {
        variant: 'default' as const,
        label: t('booking.noShow'),
      },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusColor = (status: BookingStatus) => {
    const colorMap = {
      [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
      [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
      [BookingStatus.COMPLETED]: 'bg-green-100 text-green-700',
      [BookingStatus.CANCELLED]: 'bg-red-100 text-red-700',
      [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-700',
    };
    return colorMap[status];
  };

  const calendarEvents = bookings.map((booking: Booking) => ({
    id: booking.id,
    date: new Date(booking.date), // Ensure date object
    title: `${booking.customerName} - ${booking.serviceName}`,
    time: booking.startTime,
    color: getStatusColor(booking.status),
  }));

  const columns = [
    {
      key: 'customerName',
      header: t('booking.customer'),
      render: (booking: Booking) => (
        <div>
          <p className="font-medium">{booking.customerName}</p>
          <p className="text-xs text-secondary-500">{booking.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'serviceName',
      header: t('booking.service'),
    },
    {
      key: 'date',
      header: t('booking.date'),
      render: (booking: Booking) => formatDate(booking.date, 'yyyy-MM-dd'),
    },
    {
      key: 'time',
      header: t('booking.time'),
      render: (booking: Booking) => `${booking.startTime} - ${booking.endTime}`,
    },
    {
      key: 'price',
      header: t('booking.price'),
      render: (booking: Booking) => formatPrice(booking.price),
    },
    {
      key: 'status',
      header: t('booking.status'),
      render: (booking: Booking) => getStatusBadge(booking.status),
    },
    {
      key: 'source',
      header: t('booking.source'),
      render: (booking: Booking) => {
        const sourceLabels: Record<string, string> = {
          ONLINE: t('booking.online'),
          PHONE: t('booking.phone'),
          WALK_IN: t('booking.walkIn'),
        };
        return sourceLabels[booking.source] || booking.source;
      },
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              {t('booking.title')}
            </h1>
            <p className="text-secondary-600 mt-1">
              예약을 관리하고 새로운 예약을 추가하세요
            </p>
          </div>
          <div className="flex space-x-3">
            <div className="flex border border-secondary-200 rounded-lg overflow-hidden">
              <button
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-secondary-600 hover:bg-secondary-50'
                }`}
                onClick={() => setViewMode('calendar')}
              >
                <CalendarIcon size={18} />
                <span>캘린더</span>
              </button>
              <button
                className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-secondary-600 hover:bg-secondary-50'
                }`}
                onClick={() => setViewMode('table')}
              >
                <List size={18} />
                <span>목록</span>
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowNewBookingModal(true)}
            >
              <Plus size={20} className="mr-2" />
              {t('booking.new')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="date"
              label={t('booking.date')}
              value={formatDate(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
            <Select
              label={t('booking.status')}
              options={[
                { value: '', label: '전체' },
                { value: BookingStatus.PENDING, label: t('booking.pending') },
                {
                  value: BookingStatus.CONFIRMED,
                  label: t('booking.confirmed'),
                },
                {
                  value: BookingStatus.COMPLETED,
                  label: t('booking.completed'),
                },
                {
                  value: BookingStatus.CANCELLED,
                  label: t('booking.cancelled'),
                },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              label={t('booking.designer')}
              options={[{ value: '', label: '전체' }, ...designers]}
            />
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter size={20} className="mr-2" />
                필터 적용
              </Button>
            </div>
          </div>
        </Card>

        {/* Calendar or Table View */}
        {viewMode === 'calendar' ? (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            events={calendarEvents}
            onEventClick={(event) => {
              const booking = bookings.find((b: Booking) => b.id === event.id);
              if (booking) {
                console.log('View booking:', booking);
              }
            }}
            onTimeSlotClick={(date, time) => {
              setSelectedDate(date);
              setSelectedTime(time);
              setShowNewBookingModal(true);
            }}
          />
        ) : (
          <Card>
            <Table
              data={bookings}
              columns={columns}
              onRowClick={(booking) => console.log('View booking:', booking)}
            />
          </Card>
        )}
      </div>

      {/* New Booking Modal */}
      <Modal
        isOpen={showNewBookingModal}
        onClose={() => {
          setShowNewBookingModal(false);
          setSelectedTime('');
        }}
        title={t('booking.new')}
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('customer.name')}
              required
              placeholder="고객 이름을 입력하세요"
            />
            <Input
              label={t('customer.phone')}
              required
              placeholder="010-0000-0000"
            />
          </div>

          <Select label={t('booking.designer')} required options={designers} />

          <Select
            label={t('booking.service')}
            required
            options={[
              { value: 'sv1', label: '커트 - 35,000원' },
              { value: 'sv2', label: '염색 - 120,000원' },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label={t('booking.date')}
              required
              value={formatDate(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
            <Input
              type="time"
              label={t('booking.time')}
              required
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>

          <Input
            label={t('booking.notes')}
            placeholder="특이사항이 있다면 입력하세요"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowNewBookingModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
