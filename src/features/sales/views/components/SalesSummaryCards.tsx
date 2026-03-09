'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import type { SalesSummary } from '../../types';

interface Props {
  summary: SalesSummary;
}

export function SalesSummaryCards({ summary }: Props) {
  const t = useTranslations('sales');

  const cards = [
    {
      label: t('totalRevenue'),
      value: formatPrice(summary.totalRevenue),
      highlight: true,
    },
    {
      label: t('serviceRevenue'),
      value: formatPrice(summary.serviceRevenue),
      highlight: false,
    },
    {
      label: t('productRevenue'),
      value: formatPrice(summary.productRevenue),
      highlight: false,
    },
    {
      label: t('totalBookings'),
      value: `${summary.bookingCount}${t('bookingUnit')}`,
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl p-4 ${
            card.highlight
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-secondary-200'
          }`}
        >
          <p className={`text-xs font-medium mb-1 ${card.highlight ? 'text-primary-100' : 'text-secondary-500'}`}>
            {card.label}
          </p>
          <p className={`text-xl font-bold ${card.highlight ? 'text-white' : 'text-secondary-900'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
