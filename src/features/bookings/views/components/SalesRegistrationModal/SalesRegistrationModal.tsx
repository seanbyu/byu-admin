'use client';

import { memo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastProvider';
import { ServiceSelector } from '../ServiceSelector';
import { ProductSelector } from '../ProductSelector';
import { Booking } from '../../../types';
import { BookingStatus } from '@/types';
import { SalesRegistrationModalProps, PaymentMethod, SalesTab } from './types';
import { useSalesModalState } from './useSalesModalState';
import { DiscountPriceList } from './DiscountPriceList';

export const SalesRegistrationModal = memo(function SalesRegistrationModal({
  isOpen,
  onClose,
  booking,
  onSave,
}: SalesRegistrationModalProps) {
  const t = useTranslations();
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    salonId,
    activeTab,
    setActiveTab,
    selectedServiceIds,
    selectedServiceGroups,
    totalServiceDuration,
    handleServiceAdd,
    handleRemoveCategoryServices,
    items,
    itemDiscounts,
    itemFinalPrices,
    totalServicePrice,
    updateItem,
    selectedProductIds,
    selectedProductGroups,
    handleProductAdd,
    handleRemoveProduct,
    productItems,
    productItemDiscounts,
    productItemFinalPrices,
    totalProductAmount,
    updateProductItem,
    productNameSummary,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    menuMap,
    categoryNameMap,
  } = useSalesModalState(isOpen, booking);

  const isSalesRegistered = !!booking?.bookingMeta?.sales_registered;

  const handleSave = useCallback(() => {
    if (!booking || selectedServiceIds.length === 0) return;

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
      productAmount: totalProductAmount,
      productName: productNameSummary || undefined,
      notes: notes.trim() || undefined,
      status: BookingStatus.COMPLETED,
      bookingMeta: {
        ...(booking.bookingMeta || {}),
        sales_registered: true,
        service_ids: selectedServiceIds,
        product_ids: selectedProductIds,
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
    selectedProductIds,
    totalServicePrice,
    totalProductAmount,
    productNameSummary,
    paymentMethod,
    notes,
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
          <div className="rounded-lg bg-secondary-50 p-3 text-sm space-y-0.5">
            <p className="font-medium text-secondary-900">
              {typeof booking.date === 'string'
                ? booking.date
                : booking.date.toLocaleDateString()}{' '}
              / {booking.startTime.slice(0, 5)} / {booking.customerName}
            </p>
            <p className="text-xs text-secondary-500">
              {t('booking.staff')}: {booking.staffName}
            </p>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-secondary-200">
            {(['service', 'product'] as SalesTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-secondary-400 hover:text-secondary-600'
                }`}
              >
                {t(`booking.salesModal.${tab}Tab`)}
              </button>
            ))}
          </div>

          {/* 서비스 탭 - 선택기만 */}
          <div className={activeTab !== 'service' ? 'hidden' : ''}>
            <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
              <label className="block text-sm font-medium text-secondary-800 mb-2">
                {t('booking.service')}
              </label>
              {selectedServiceGroups.length > 0 && (
                <div className="mb-2 space-y-1 rounded-lg border border-primary-200 bg-white p-1.5">
                  {selectedServiceGroups.map((group) => (
                    <div
                      key={group.categoryId}
                      className="flex items-center justify-between rounded bg-primary-50 px-2 py-1"
                    >
                      <span className="text-xs font-medium text-primary-700 truncate">
                        {group.categoryName} x{group.count}
                        <span className="ml-1.5 font-normal text-secondary-500">
                          {group.totalDuration}min / ฿{group.totalPrice.toLocaleString()}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveCategoryServices(group.categoryId)
                        }
                        className="ml-2 h-5 w-5 shrink-0 rounded border border-primary-300 bg-white text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                        aria-label="Remove category services"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-primary-100 pt-1 px-1 text-[11px] text-secondary-500">
                    <span>{t('booking.total')} {selectedServiceIds.length}</span>
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
          </div>

          {/* 제품 탭 - 선택기만 */}
          <div className={activeTab !== 'product' ? 'hidden' : ''}>
            <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
              {selectedProductGroups.length > 0 && (
                <div className="mb-2 space-y-1 rounded-lg border border-primary-200 bg-white p-1.5">
                  {selectedProductGroups.map((g) => (
                    <div
                      key={g.product.id}
                      className="flex items-center justify-between rounded bg-primary-50 px-2 py-1"
                    >
                      <span className="text-xs font-medium text-primary-700 truncate">
                        {g.product.name} x{g.count}
                        <span className="ml-1.5 font-normal text-secondary-500">
                          {formatPrice(g.total)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(g.product.id)}
                        className="ml-2 h-5 w-5 shrink-0 rounded border border-primary-300 bg-white text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-primary-100 pt-1 px-1 text-[11px] text-secondary-500">
                    <span>{t('booking.total')} {selectedProductIds.length}</span>
                    <span>{formatPrice(totalProductAmount)}</span>
                  </div>
                </div>
              )}
              <ProductSelector
                salonId={salonId}
                selectedProductIds={selectedProductIds}
                onProductAdd={handleProductAdd}
              />
            </div>
          </div>

          {/* ── 아래부터 탭과 무관하게 항상 표시 ── */}

          {/* 카테고리별 시술 금액 + 할인 */}
          <DiscountPriceList
            label={t('booking.salesModal.servicePrice')}
            items={items}
            discounts={itemDiscounts}
            finalPrices={itemFinalPrices}
            totalPrice={totalServicePrice}
            onUpdateItem={updateItem}
          />

          {/* 제품별 금액 + 할인 */}
          <DiscountPriceList
            label={t('booking.salesModal.productAmount')}
            items={productItems}
            discounts={productItemDiscounts}
            finalPrices={productItemFinalPrices}
            totalPrice={totalProductAmount}
            onUpdateItem={updateProductItem}
          />

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('booking.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('booking.placeholders.notesPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-800 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
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

          {/* 합계 표시 */}
          <div className="rounded-lg bg-primary-50 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700">
              {t('booking.total')}
            </span>
            <span className="text-lg font-bold text-primary-700">
              {formatPrice(totalServicePrice + totalProductAmount)}
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
