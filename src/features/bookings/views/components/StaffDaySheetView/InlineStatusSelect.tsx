'use client';

import { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { BookingStatus } from '@/types';
import { STATUS_STYLES } from './StatusBadge';

/** 상태 변경 드롭다운에 표시할 순서 */
const STATUS_ORDER: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW,
];

/** enum 값 → 번역 키 매핑 */
const STATUS_I18N_KEY: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'booking.pending',
  [BookingStatus.CONFIRMED]: 'booking.confirmed',
  [BookingStatus.IN_PROGRESS]: 'booking.inProgress',
  [BookingStatus.COMPLETED]: 'booking.completed',
  [BookingStatus.CANCELLED]: 'booking.cancelled',
  [BookingStatus.NO_SHOW]: 'booking.noShow',
};

export const InlineStatusSelect = memo(function InlineStatusSelect({
  bookingId,
  status,
  onUpdate,
  disabled,
}: {
  bookingId: string;
  status: BookingStatus;
  onUpdate: (id: string, status: BookingStatus) => void;
  disabled?: boolean;
}) {
  const t = useTranslations();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.stopPropagation();
      const newStatus = e.target.value as BookingStatus;
      if (newStatus !== status) {
        onUpdate(bookingId, newStatus);
      }
    },
    [bookingId, status, onUpdate]
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[status]}`}
        onClick={handleClick}
      >
        {t(STATUS_I18N_KEY[status])}
      </span>
    );
  }

  return (
    <Select
      value={status}
      onChange={handleChange}
      onClick={handleClick}
      options={STATUS_ORDER.map((s) => ({ value: s, label: t(STATUS_I18N_KEY[s]) }))}
      showPlaceholder={false}
      containerClassName="!w-auto"
      className={`!w-auto inline-flex items-center !px-2 !py-0.5 !rounded !text-xs !font-medium !border cursor-pointer outline-none focus:!ring-1 focus:!ring-primary-400 appearance-none bg-no-repeat bg-[length:12px] bg-[right_4px_center] !pr-5 ${STATUS_STYLES[status]}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      }}
    />
  );
});
