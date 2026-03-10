'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SalesByStaff as SalesByStaffType } from '../../types';

interface Props {
  data: SalesByStaffType[];
}

export function SalesByStaff({ data }: Props) {
  const t = useTranslations('sales');

  return (
    <Card title={t('byStaff')} padding="sm">
      {data.length === 0 ? (
        <EmptyState message={t('noData')} size="sm" />
      ) : (
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-100">
                <th className="text-left py-2 pr-3 text-xs font-medium text-secondary-500">{t('staffName')}</th>
                <th className="text-right py-2 pr-3 text-xs font-medium text-secondary-500">{t('count')}</th>
                <th className="text-right py-2 pr-3 text-xs font-medium text-secondary-500">{t('serviceRevenue')}</th>
                <th className="text-right py-2 text-xs font-medium text-secondary-500">{t('totalRevenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50">
              {data.map((row) => (
                <tr key={row.staffId} className="hover:bg-secondary-50">
                  <td className="py-2 pr-3 font-medium text-secondary-800">{row.staffName}</td>
                  <td className="py-2 pr-3 text-right text-secondary-600">{row.count}</td>
                  <td className="py-2 pr-3 text-right text-secondary-600">{formatPrice(row.serviceAmount)}</td>
                  <td className="py-2 text-right font-semibold text-secondary-900">{formatPrice(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
