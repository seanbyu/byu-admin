'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import type { SalesByPayment as SalesByPaymentType } from '../../types';

interface Props {
  data: SalesByPaymentType[];
  totalRevenue: number;
}

const METHOD_COLORS: Record<string, string> = {
  CARD: 'bg-blue-500',
  CASH: 'bg-success-500',
  TRANSFER: 'bg-warning-500',
  '미등록': 'bg-secondary-300',
};

export function SalesByPayment({ data, totalRevenue }: Props) {
  const t = useTranslations('sales');

  return (
    <Card title={t('byPayment')} padding="sm">
      {data.length === 0 ? (
        <p className="text-sm text-secondary-400 py-4 text-center">{t('noData')}</p>
      ) : (
        <div className="space-y-3 pt-2">
          {data.map((item) => {
            const pct = totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : 0;
            const color = METHOD_COLORS[item.label] ?? 'bg-secondary-300';
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="font-medium text-secondary-700">{item.label}</span>
                    <span className="text-secondary-400 text-xs">({item.count}{t('bookingUnit')})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-secondary-900">{formatPrice(item.amount)}</span>
                    <span className="ml-1.5 text-xs text-secondary-400">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
