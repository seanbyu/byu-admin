'use client';

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import {
  useMenus,
  useCategories,
} from '@/features/salon-menus/hooks/useSalonMenus';
import { ServiceSelector } from '../ServiceSelector';
import { Booking } from '../../../types';

type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER' | '';
type DiscountType = 'percent' | 'fixed';

interface CategoryPriceItem {
  categoryId: string;
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
  const toast = useToast();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });
  const { categories } = useCategories(salonId);

  // 매출 등록 여부
  const isSalesRegistered = !!booking?.bookingMeta?.sales_registered;

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [items, setItems] = useState<CategoryPriceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [productAmount, setProductAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

  // 메뉴/카테고리 맵
  const menuMap = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        category_id: string;
        name: string;
        duration_minutes?: number;
        base_price?: number;
        price?: number;
      }
    > = {};
    (menus || []).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [menus]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (categories || []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // 카테고리별 그룹 (서비스 선택 표시용)
  const selectedServiceGroups = useMemo(() => {
    const groups: {
      categoryId: string;
      categoryName: string;
      count: number;
      totalDuration: number;
      totalPrice: number;
    }[] = [];
    const groupMap = new Map<string, number>();

    selectedServiceIds.forEach((id) => {
      const menu = menuMap[id];
      if (!menu) return;
      const catId = menu.category_id;
      const idx = groupMap.get(catId);

      if (idx !== undefined) {
        groups[idx].count += 1;
        groups[idx].totalDuration += menu.duration_minutes || 60;
        groups[idx].totalPrice += menu.base_price || menu.price || 0;
      } else {
        groupMap.set(catId, groups.length);
        groups.push({
          categoryId: catId,
          categoryName: categoryNameMap[catId] || menu.name,
          count: 1,
          totalDuration: menu.duration_minutes || 60,
          totalPrice: menu.base_price || menu.price || 0,
        });
      }
    });

    return groups;
  }, [selectedServiceIds, menuMap, categoryNameMap]);

  const totalServiceDuration = useMemo(
    () => selectedServiceGroups.reduce((sum, g) => sum + g.totalDuration, 0),
    [selectedServiceGroups]
  );

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen && booking && !isServiceInitialized) {
      const serviceIds = booking.bookingMeta?.service_ids;
      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        setSelectedServiceIds(serviceIds);
      } else if (booking.serviceId) {
        setSelectedServiceIds([booking.serviceId]);
      } else {
        setSelectedServiceIds([]);
      }

      setPaymentMethod((booking.paymentMethod as PaymentMethod) || '');
      setProductAmount(String(booking.productAmount || 0));
      setProductName(booking.productName || '');
      setIsServiceInitialized(true);
    }

    if (!isOpen && isServiceInitialized) {
      setIsServiceInitialized(false);
      setSelectedServiceIds([]);
      setItems([]);
    }
  }, [isOpen, booking, isServiceInitialized]);

  // selectedServiceIds 변경 → items 갱신 (기존 할인 설정 보존)
  useEffect(() => {
    if (!isServiceInitialized) return;

    setItems((prev) => {
      const prevMap = new Map(prev.map((item) => [item.categoryId, item]));

      return selectedServiceGroups.map((group) => {
        const existing = prevMap.get(group.categoryId);
        if (existing) {
          // 카테고리가 이미 있으면 가격만 갱신, 할인 설정 유지
          return { ...existing, price: String(group.totalPrice) };
        }
        return {
          categoryId: group.categoryId,
          categoryName: group.categoryName,
          price: String(group.totalPrice),
          showDiscount: false,
          discountType: 'percent' as DiscountType,
          discountValue: '',
        };
      });
    });
  }, [selectedServiceGroups, isServiceInitialized]);

  // 서비스 추가
  const handleServiceAdd = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => [...prev, serviceId]);
  }, []);

  // 카테고리 그룹 전체 삭제
  const handleRemoveCategoryServices = useCallback(
    (categoryId: string) => {
      setSelectedServiceIds((prev) =>
        prev.filter((id) => menuMap[id]?.category_id !== categoryId)
      );
    },
    [menuMap]
  );

  // 아이템 업데이트 헬퍼
  const updateItem = useCallback(
    (index: number, updates: Partial<CategoryPriceItem>) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // 각 아이템의 할인 금액
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
    if (!booking || selectedServiceIds.length === 0) return;
    const productAmountNum = Number(productAmount) || 0;

    const categoryNames = [
      ...new Set(
        selectedServiceIds
          .map((id) => menuMap[id])
          .filter(Boolean)
          .map((m) => categoryNameMap[m!.category_id] || m!.name)
      ),
    ];
    const serviceName = categoryNames.join(', ');
    const primaryServiceId = selectedServiceIds[0];

    onSave(booking.id, {
      serviceId: primaryServiceId,
      serviceName,
      price: totalServicePrice,
      paymentMethod: paymentMethod || undefined,
      productAmount: productAmountNum,
      productName: productName.trim() || undefined,
      bookingMeta: {
        ...(booking.bookingMeta || {}),
        sales_registered: true,
        service_ids: selectedServiceIds,
        category_name: serviceName,
      },
    } as Partial<Booking> & { bookingMeta?: Record<string, any> });

    toast.success(
      isSalesRegistered
        ? t('booking.salesModal.salesUpdated')
        : t('booking.salesModal.salesRegistered')
    );
    onClose();
  }, [
    booking,
    selectedServiceIds,
    totalServicePrice,
    paymentMethod,
    productAmount,
    productName,
    menuMap,
    categoryNameMap,
    onSave,
    onClose,
    toast,
    isSalesRegistered,
    t,
  ]);

  const handleDeleteSales = useCallback(() => {
    if (!booking) return;

    onSave(booking.id, {
      price: 0,
      paymentMethod: undefined,
      productAmount: 0,
      productName: undefined,
      bookingMeta: { ...(booking.bookingMeta || {}), sales_registered: false },
    } as Partial<Booking> & { bookingMeta?: Record<string, any> });

    toast.success(t('booking.salesModal.salesDeleted'));
    setShowDeleteConfirm(false);
    onClose();
  }, [booking, onSave, onClose, toast, t]);

  if (!booking) return null;

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: '', label: t('booking.salesModal.noPayment') },
    { value: 'CARD', label: t('booking.paymentMethodCard') },
    { value: 'CASH', label: t('booking.paymentMethodCash') },
    { value: 'TRANSFER', label: t('booking.paymentMethodTransfer') },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isSalesRegistered
            ? t('booking.salesModal.editTitle')
            : t('booking.salesModal.title')
        }
        size="sm"
      >
        <div className="space-y-4 text-secondary-800">
          {/* 예약 정보 헤더 */}
          <div className="rounded-lg bg-secondary-50 p-3 text-sm">
            <p className="font-medium text-secondary-900">
              {booking.startTime.slice(0, 5)} · {booking.customerName}
            </p>
          </div>

          {/* 서비스 선택 영역 */}
          <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
            <label className="block text-sm font-medium text-secondary-800 mb-2">
              {t('booking.service')}
            </label>
            {selectedServiceGroups.length > 0 && (
              <div className="mb-3 space-y-1.5 rounded-lg border border-primary-200 bg-white p-2.5">
                {selectedServiceGroups.map((group) => (
                  <div
                    key={group.categoryId}
                    className="flex items-center justify-between rounded-md bg-primary-50 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary-700 truncate">
                        {group.categoryName} x{group.count}
                      </p>
                      <p className="text-xs text-secondary-600">
                        {group.totalDuration}min / ฿
                        {group.totalPrice.toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveCategoryServices(group.categoryId)
                      }
                      className="h-7 w-7 rounded-md border border-primary-300 bg-white text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                      aria-label="Remove category services"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-primary-100 pt-2 text-xs text-secondary-700">
                  <span>
                    {t('booking.total')} {selectedServiceIds.length}
                  </span>
                  <span>
                    {totalServiceDuration}min / ฿
                    {selectedServiceGroups
                      .reduce((s, g) => s + g.totalPrice, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <ServiceSelector
              salonId={salonId}
              selectedServiceIds={selectedServiceIds}
              onServiceAdd={handleServiceAdd}
            />
          </div>

          {/* 카테고리별 시술 금액 + 할인 */}
          {items.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">
                {t('booking.salesModal.servicePrice')}
              </label>

              {items.map((item, index) => (
                <div
                  key={item.categoryId}
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
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, { price: e.target.value })
                        }
                        min={0}
                        className="text-right"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(index, {
                              discountType: 'percent',
                              discountValue: '',
                            })
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
                            updateItem(index, {
                              discountType: 'fixed',
                              discountValue: '',
                            })
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
                          onChange={(e) =>
                            updateItem(index, { discountValue: e.target.value })
                          }
                          min={0}
                          max={
                            item.discountType === 'percent' ? 100 : undefined
                          }
                          placeholder="0"
                          className="text-right pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-secondary-400 pointer-events-none">
                          {item.discountType === 'percent' ? '%' : '฿'}
                        </span>
                      </div>
                      {itemDiscounts[index] > 0 && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-secondary-500">
                            <span>{t('booking.salesModal.originalPrice')}</span>
                            <span>{formatPrice(Number(item.price) || 0)}</span>
                          </div>
                          <div className="flex justify-between text-error-600">
                            <span>
                              {t('booking.salesModal.discountAmount')}
                            </span>
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

              {items.length > 1 && (
                <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-secondary-200">
                  <span className="text-secondary-600">
                    {t('booking.salesModal.servicePrice')} {t('booking.total')}
                  </span>
                  <span className="font-semibold text-secondary-900">
                    {formatPrice(totalServicePrice)}
                  </span>
                </div>
              )}
            </div>
          )}

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
          <div
            className={`flex ${isSalesRegistered ? 'justify-between' : 'justify-end'} pt-2`}
          >
            {isSalesRegistered && (
              <Button
                variant="danger"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t('booking.salesModal.deleteSales')}
              </Button>
            )}
            <div className="flex space-x-3">
              <Button variant="outline" type="button" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleSave}
                disabled={selectedServiceIds.length === 0}
              >
                {isSalesRegistered
                  ? t('booking.salesModal.editSales')
                  : t('booking.salesModal.registerSales')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSales}
        title={t('booking.salesModal.deleteConfirmTitle')}
        description={t('booking.salesModal.deleteConfirmDescription')}
        variant="destructive"
      />
    </>
  );
});
