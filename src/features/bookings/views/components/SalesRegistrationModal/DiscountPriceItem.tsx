import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/lib/utils';
import { CategoryPriceItem } from './types';

interface DiscountPriceItemProps {
  item: CategoryPriceItem;
  finalPrice: number;
  discount: number;
  onUpdate: (updates: Partial<CategoryPriceItem>) => void;
}

export function DiscountPriceItem({
  item,
  finalPrice,
  discount,
  onUpdate,
}: DiscountPriceItemProps) {
  const t = useTranslations();

  return (
    <div className="rounded-lg border border-secondary-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-secondary-50">
        <span className="text-sm font-medium text-secondary-800">
          {item.categoryName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-secondary-900">
            {formatPrice(finalPrice)}
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                showDiscount: !item.showDiscount,
                ...(item.showDiscount && { discountValue: '' }),
              })
            }
            className="flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            {item.showDiscount ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            {t('booking.salesModal.editDiscount')}
          </button>
        </div>
      </div>

      {item.showDiscount && (
        <div className="px-3 py-3 space-y-3 border-t border-secondary-100">
          <Input
            type="number"
            value={item.price}
            onChange={(e) => onUpdate({ price: e.target.value })}
            min={0}
            className="text-right"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() =>
                onUpdate({ discountType: 'percent', discountValue: '' })
              }
              className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                item.discountType === 'percent'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {t('booking.salesModal.discountPercent')}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdate({ discountType: 'fixed', discountValue: '' })
              }
              className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                item.discountType === 'fixed'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {t('booking.salesModal.discountFixed')}
            </button>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={item.discountValue}
              onChange={(e) => onUpdate({ discountValue: e.target.value })}
              min={0}
              max={item.discountType === 'percent' ? 100 : undefined}
              placeholder="0"
              className="text-right pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-secondary-400 pointer-events-none">
              {item.discountType === 'percent' ? '%' : '฿'}
            </span>
          </div>
          {discount > 0 && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-secondary-500">
                <span>{t('booking.salesModal.originalPrice')}</span>
                <span>{formatPrice(Number(item.price) || 0)}</span>
              </div>
              <div className="flex justify-between text-error-600">
                <span>{t('booking.salesModal.discountAmount')}</span>
                <span>-{formatPrice(discount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-secondary-900 border-t border-secondary-200 pt-1">
                <span>{t('booking.salesModal.finalPrice')}</span>
                <span>{formatPrice(finalPrice)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
