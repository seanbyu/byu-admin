'use client';

import { memo, useState, useCallback } from 'react';
import { formatPrice } from '@/lib/utils';

export const InlinePriceCell = memo(function InlinePriceCell({
  bookingId,
  price,
  onUpdate,
}: {
  bookingId: string;
  price: number;
  onUpdate: (id: string, price: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(price));

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValue(String(price));
      setEditing(true);
    },
    [price]
  );

  const commit = useCallback(
    (raw: string) => {
      setEditing(false);
      const num = Number(raw);
      if (!isNaN(num) && num !== price) {
        onUpdate(bookingId, num);
      }
    },
    [bookingId, price, onUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
      if (e.key === 'Escape') setEditing(false);
    },
    [commit]
  );

  if (editing) {
    return (
      <input
        type="number"
        autoFocus
        className="w-full text-right border border-primary-400 rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary-500"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        min={0}
      />
    );
  }

  return (
    <span
      className="cursor-pointer hover:text-primary-600 hover:underline block text-right w-full"
      onClick={handleClick}
      title="클릭하여 수정"
    >
      {price > 0 ? formatPrice(price) : '—'}
    </span>
  );
});
