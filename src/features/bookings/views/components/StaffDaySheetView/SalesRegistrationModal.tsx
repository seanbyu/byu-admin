'use client';

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useMenus, useCategories } from '@/features/salon-menus/hooks/useSalonMenus';
import { Booking } from '../../../types';

type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER' | '';
type DiscountType = 'percent' | 'fixed';

interface CategoryPriceItem {
  categoryName: string;
  price: string;
  showDiscount: boolean;
  discountType: DiscountType;
  discountValue: string;
}

interface SalesRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSave: (id: string, updates: Partial<Booking>) => void;
}

export const SalesRegistrationModal = memo(function SalesRegistrationModal({
  isOpen,
  onClose,
  booking,
  onSave,
}: SalesRegistrationModalProps) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });
  const { categories } = useCategories(salonId);

  const [items, setItems] = useState<CategoryPriceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [productAmount, setProductAmount] = useState('');
  const [productName, setProductName] = useState('');

  // 메뉴/카테고리 맵 빌드
  const menuMap = useMemo(() => {
    const map: Record<string, { category_id: string; name: string; base_price?: number; price?: number }> = {};
    (menus || []).forEach((m) => { map[m.id] = m; });
    return map;
  }, [menus]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (categories || []).forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [categories]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen && booking) {
      const serviceIds = booking.bookingMeta?.service_ids;

      if (Array.isArray(serviceIds) && serviceIds.length > 0 && menus?.length) {
        // 복수 서비스: 카테고리별 그룹핑
        const groups: Record<string, { categoryName: string; totalPrice: number }> = {};
        const order: string[] = [];

        serviceIds.forEach((id: string) => {
          const menu = menuMap[id];
          if (!menu) return;
          const catId = menu.category_id;
          if (!groups[catId]) {
            groups[catId] = {
              categoryName: categoryNameMap[catId] || menu.name,
              totalPrice: 0,
            };
            order.push(catId);
          }
          groups[catId].totalPrice += menu.base_price || menu.price || 0;
        });

        setItems(
          order.map((catId) => ({
            categoryName: groups[catId].categoryName,
            price: String(groups[catId].totalPrice),
            showDiscount: false,
            discountType: 'percent' as DiscountType,
            discountValue: '',
          }))
        );
      } else {
        // 단일 서비스 또는 메타 없음
        setItems([
          {
            categoryName: booking.serviceName || '',
            price: String(booking.price || 0),
            showDiscount: false,
            discountType: 'percent' as DiscountType,
            discountValue: '',
          },
        ]);
      }

      setPaymentMethod((booking.paymentMethod as PaymentMethod) || '');
      setProductAmount(String(booking.productAmount || 0));
      setProductName(booking.productName || '');
    }
  }, [isOpen, booking, menus, categories, menuMap, categoryNameMap]);

  // 아이템 업데이트 헬퍼
  const updateItem = useCallback(
    (index: number, updates: Partial<CategoryPriceItem>) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // 각 아이템의 할인 금액 계산
  const itemDiscounts = useMemo(() => {
    return items.map((item) => {
      const base = Number(item.price) || 0;
      const val = Number(item.discountValue) || 0;
      if (val <= 0) return 0;
      if (item.discountType === 'percent') {
        return Math.round((base * Math.min(val, 100)) / 100);
      }
      return Math.min(val, base);
    });
  }, [items]);

  // 각 아이템의 최종 금액
  const itemFinalPrices = useMemo(() => {
    return items.map((item, i) => {
      const base = Number(item.price) || 0;
      return Math.max(base - itemDiscounts[i], 0);
    });
  }, [items, itemDiscounts]);

  // 시술 합계
  const totalServicePrice = useMemo(
    () => itemFinalPrices.reduce((sum, p) => sum + p, 0),
    [itemFinalPrices]
  );

  const handleSave = useCallback(() => {
    if (!booking) return;
    const productAmountNum = Number(productAmount) || 0;

    onSave(booking.id, {
      price: totalServicePrice,
      paymentMethod: paymentMethod || undefined,
      productAmount: productAmountNum,
      productName: productName.trim() || undefined,
    });

    onClose();
  }, [booking, totalServicePrice, paymentMethod, productAmount, productName, onSave, onClose]);

  if (!booking) return null;

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: '', label: t('booking.salesModal.noPayment') },
    { value: 'CARD', label: t('booking.paymentMethodCard') },
    { value: 'CASH', label: t('booking.paymentMethodCash') },
    { value: 'TRANSFER', label: t('booking.paymentMethodTransfer') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('booking.salesModal.title')}
      size="sm"
    >
      <div className="space-y-4 text-secondary-800">
        {/* 예약 정보 헤더 */}
        <div className="rounded-lg bg-secondary-50 p-3 text-sm">
          <p className="font-medium text-secondary-900">
            {booking.startTime.slice(0, 5)} · {booking.customerName}
          </p>
          <p className="mt-0.5 text-xs text-secondary-500">
            {booking.serviceName}
          </p>
        </div>

        {/* 카테고리별 시술 금액 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            {t('booking.salesModal.servicePrice')}
          </label>

          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-secondary-200 bg-white overflow-hidden"
            >
              {/* 카테고리 헤더 */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-secondary-50">
                <span className="text-sm font-medium text-secondary-800">
                  {item.categoryName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-secondary-900">
                    {formatPrice(itemFinalPrices[index])}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(index, {
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

              {/* 할인 패널 */}
              {item.showDiscount && (
                <div className="px-3 py-3 space-y-3 border-t border-secondary-100">
                  {/* 원가 입력 */}
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, { price: e.target.value })}
                    min={0}
                    className="text-right"
                  />

                  {/* 할인 타입 */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(index, { discountType: 'percent', discountValue: '' })
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
                        updateItem(index, { discountType: 'fixed', discountValue: '' })
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

                  {/* 할인 값 */}
                  <div className="relative">
                    <Input
                      type="number"
                      value={item.discountValue}
                      onChange={(e) =>
                        updateItem(index, { discountValue: e.target.value })
                      }
                      min={0}
                      max={item.discountType === 'percent' ? 100 : undefined}
                      placeholder="0"
                      className="text-right pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-secondary-400 pointer-events-none">
                      {item.discountType === 'percent' ? '%' : '฿'}
                    </span>
                  </div>

                  {/* 할인 요약 */}
                  {itemDiscounts[index] > 0 && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-secondary-500">
                        <span>{t('booking.salesModal.originalPrice')}</span>
                        <span>{formatPrice(Number(item.price) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-error-600">
                        <span>{t('booking.salesModal.discountAmount')}</span>
                        <span>-{formatPrice(itemDiscounts[index])}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-secondary-900 border-t border-secondary-200 pt-1">
                        <span>{t('booking.salesModal.finalPrice')}</span>
                        <span>{formatPrice(itemFinalPrices[index])}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 시술 합계 (2개 이상일 때만) */}
          {items.length > 1 && (
            <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-secondary-200">
              <span className="text-secondary-600">{t('booking.salesModal.servicePrice')} {t('booking.total')}</span>
              <span className="font-semibold text-secondary-900">{formatPrice(totalServicePrice)}</span>
            </div>
          )}
        </div>

        {/* 결제수단 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('booking.salesModal.paymentMethod')}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {paymentOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentMethod(opt.value)}
                className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  paymentMethod === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제품 금액 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('booking.salesModal.productAmount')}
          </label>
          <Input
            type="number"
            value={productAmount}
            onChange={(e) => setProductAmount(e.target.value)}
            min={0}
            className="text-right"
          />
        </div>

        {/* 제품명 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('booking.salesModal.productName')}
          </label>
          <Input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t('booking.salesModal.productNamePlaceholder')}
          />
        </div>

        {/* 합계 표시 */}
        <div className="rounded-lg bg-primary-50 p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">
            {t('booking.total')}
          </span>
          <span className="text-lg font-bold text-primary-700">
            {formatPrice(totalServicePrice + (Number(productAmount) || 0))}
          </span>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="button" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});
