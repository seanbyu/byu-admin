import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { CategoryPriceItem } from './types';
import { DiscountPriceItem } from './DiscountPriceItem';

interface DiscountPriceListProps {
  label: string;
  items: CategoryPriceItem[];
  discounts: number[];
  finalPrices: number[];
  totalPrice: number;
  onUpdateItem: (index: number, updates: Partial<CategoryPriceItem>) => void;
}

export function DiscountPriceList({
  label,
  items,
  discounts,
  finalPrices,
  totalPrice,
  onUpdateItem,
}: DiscountPriceListProps) {
  const t = useTranslations();

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary-700">
        {label}
      </label>

      {items.map((item, index) => (
        <DiscountPriceItem
          key={item.categoryId}
          item={item}
          finalPrice={finalPrices[index]}
          discount={discounts[index]}
          onUpdate={(updates) => onUpdateItem(index, updates)}
        />
      ))}

      {items.length > 1 && (
        <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-secondary-200">
          <span className="text-secondary-600">
            {label} {t('booking.total')}
          </span>
          <span className="font-semibold text-secondary-900">
            {formatPrice(totalPrice)}
          </span>
        </div>
      )}
    </div>
  );
}
