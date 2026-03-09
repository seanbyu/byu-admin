'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import type { SalesByMenu as SalesByMenuType } from '../../types';

interface Props {
  data: SalesByMenuType[];
  totalRevenue: number;
}

export function SalesByMenu({ data, totalRevenue }: Props) {
  const t = useTranslations('sales');

  return (
    <Card title={t('byMenu')} padding="sm">
      {data.length === 0 ? (
        <p className="text-sm text-secondary-400 py-4 text-center">{t('noData')}</p>
      ) : (
        <div className="space-y-2 pt-2">
          {data.map((item, i) => {
            const pct = totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : 0;
            return (
              <div key={item.categoryName} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-xs text-secondary-400 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-secondary-800 truncate">{item.categoryName}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-secondary-400 text-xs">{item.count}{t('bookingUnit')}</span>
                      <span className="font-semibold text-secondary-900">{formatPrice(item.amount)}</span>
                      <span className="text-xs text-secondary-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
