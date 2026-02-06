'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage,
  striped = false,
}: TableProps<T>) {
  const t = useTranslations('common');
  const emptyText = emptyMessage ?? t('noData');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-secondary-500">{emptyText}</div>
    );
  }

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-secondary-50 border-b border-secondary-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-xs font-semibold text-secondary-600 uppercase tracking-wider',
                  alignStyles[column.align || 'left'],
                  column.width
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-100">
          {data.map((item, index) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'transition-colors duration-fast',
                'hover:bg-secondary-50',
                onRowClick && 'cursor-pointer',
                striped && index % 2 === 1 && 'bg-secondary-50/50'
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-6 py-4 text-sm text-secondary-900',
                    alignStyles[column.align || 'left']
                  )}
                >
                  {column.render
                    ? column.render(item, index)
                    : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
