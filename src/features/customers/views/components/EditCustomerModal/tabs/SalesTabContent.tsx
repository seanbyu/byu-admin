'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Image, Edit2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { TabContentProps } from '../types';

export const SalesTabContent = memo(function SalesTabContent({
  customer,
}: TabContentProps) {
  const t = useTranslations();

  // TODO: Replace with actual API data
  const salesSummary = {
    service: customer.total_spent || 0,
    product: 0,
    membership: 0,
    ticket: 0,
    cancellationFee: 0,
  };

  // TODO: Replace with actual API data
  const salesHistory: {
    id: string;
    date: string;
    productName: string;
    staff: string;
    memo: string;
    amount: number;
    paymentMethod: string;
  }[] = [];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sales Summary */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-secondary-900 md:mb-3 md:text-base">
          {t('customer.sales.totalSummary')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 xl:grid-cols-5">
          <div className="rounded-lg border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('customer.tabs.service')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(salesSummary.service)}
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('customer.tabs.product')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(salesSummary.product)}
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('customer.sales.membershipSales')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(salesSummary.membership)}
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('customer.sales.ticketSales')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(salesSummary.ticket)}
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 p-2.5 md:p-3">
            <p className="mb-1 text-[11px] text-secondary-500 md:text-xs">
              {t('customer.sales.cancellationFee')}
            </p>
            <p className="text-sm font-semibold text-secondary-900 md:text-base lg:text-lg">
              {formatPrice(salesSummary.cancellationFee)}
            </p>
          </div>
        </div>
      </div>

      {/* Sales History */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-secondary-900 md:mb-3 md:text-base">
          {t('customer.sales.history')}
        </h3>
        {salesHistory.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center rounded-lg border border-secondary-200 text-sm text-secondary-400 md:h-[200px] md:text-base">
            {t('customer.sales.noHistory')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('customer.sales.date')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('customer.sales.productName')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('customer.sales.staff')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('customer.sales.memo')}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-secondary-500">
                    {t('customer.sales.actualSales')}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-secondary-500">
                    {t('customer.sales.paymentMethod')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary-500">
                    {t('customer.sales.receipt')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary-500">
                    {t('customer.sales.photo')}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-secondary-500">
                    {t('customer.sales.edit')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {salesHistory.map((sale) => (
                  <tr key={sale.id} className="hover:bg-secondary-50">
                    <td className="px-3 py-3 text-secondary-700">{sale.date}</td>
                    <td className="px-3 py-3 text-secondary-700 max-w-[200px] truncate">
                      {sale.productName}
                    </td>
                    <td className="px-3 py-3 text-secondary-700">{sale.staff}</td>
                    <td className="px-3 py-3 text-secondary-700 max-w-[100px] truncate">
                      {sale.memo}
                    </td>
                    <td className="px-3 py-3 text-right text-secondary-900 font-medium">
                      {formatPrice(sale.amount)}
                    </td>
                    <td className="px-3 py-3 text-secondary-700">
                      {sale.paymentMethod}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        className="p-1 hover:bg-secondary-100 rounded"
                      >
                        <FileText className="w-4 h-4 text-secondary-400" />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        className="p-1 hover:bg-secondary-100 rounded"
                      >
                        <Image className="w-4 h-4 text-secondary-400" />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        className="p-1 hover:bg-secondary-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-secondary-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});
