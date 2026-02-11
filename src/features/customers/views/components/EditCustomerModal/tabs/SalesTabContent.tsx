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
    <div className="space-y-6">
      {/* Sales Summary */}
      <div>
        <h3 className="text-sm font-semibold text-secondary-900 mb-3">
          {t('customer.sales.totalSummary')}
        </h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="border border-secondary-200 rounded-lg p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t('customer.tabs.service')}
            </p>
            <p className="text-lg font-semibold text-secondary-900">
              {formatPrice(salesSummary.service)}
            </p>
          </div>
          <div className="border border-secondary-200 rounded-lg p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t('customer.tabs.product')}
            </p>
            <p className="text-lg font-semibold text-secondary-900">
              {formatPrice(salesSummary.product)}
            </p>
          </div>
          <div className="border border-secondary-200 rounded-lg p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t('customer.sales.membershipSales')}
            </p>
            <p className="text-lg font-semibold text-secondary-900">
              {formatPrice(salesSummary.membership)}
            </p>
          </div>
          <div className="border border-secondary-200 rounded-lg p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t('customer.sales.ticketSales')}
            </p>
            <p className="text-lg font-semibold text-secondary-900">
              {formatPrice(salesSummary.ticket)}
            </p>
          </div>
          <div className="border border-secondary-200 rounded-lg p-3">
            <p className="text-xs text-secondary-500 mb-1">
              {t('customer.sales.cancellationFee')}
            </p>
            <p className="text-lg font-semibold text-secondary-900">
              {formatPrice(salesSummary.cancellationFee)}
            </p>
          </div>
        </div>
      </div>

      {/* Sales History */}
      <div>
        <h3 className="text-sm font-semibold text-secondary-900 mb-3">
          {t('customer.sales.history')}
        </h3>
        {salesHistory.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-secondary-400 border border-secondary-200 rounded-lg">
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
