'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { SalonMenu } from '@/features/salon-menus/types';
import { useBookings } from '../../../hooks/useBookings';
import { useCategoryMap, useMenuMap } from '../../../hooks/useMenuMaps';
import { useServiceGroups } from '../../../hooks/useServiceGroups';
import { NewBookingModalProps } from './types';
import { useBookingForm, useCustomerSearch, useBookingSave } from './hooks';
import { CustomerSection, NewCustomerConfirmModal, TimeSlotSelector, BookingDatePicker } from './components';
import { ServiceSelector } from '../ServiceSelector';

function NewBookingModalComponent({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  businessHours,
  selectedStaffId,
  selectedServiceId,
  artists,
  onDateChange,
  onTimeChange,
  onStaffChange,
  onServiceChange,
  editBooking,
}: NewBookingModalProps) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const isEditMode = !!editBooking;

  // Data hooks
  const { customers } = useCustomers({ salon_id: salonId });
  const { deleteBooking, isDeleting } = useBookings(salonId);
  const categoryMap = useCategoryMap(salonId);
  const menuMap = useMenuMap(salonId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

  // 선택된 서비스 목록 (중복 포함, useBookingSave에 전달)
  const selectedServices = useMemo<SalonMenu[]>(() => {
    return selectedServiceIds
      .map((id) => menuMap[id])
      .filter((menu): menu is SalonMenu => Boolean(menu));
  }, [selectedServiceIds, menuMap]);

  // 카테고리별 그룹 표시 (Cut x2, Perm x1 등)
  const {
    groups: selectedServiceGroups,
    totalDuration: totalServiceDuration,
    totalPrice: totalServicePrice,
  } = useServiceGroups(selectedServiceIds, menuMap, categoryMap);

  // Form hook
  const form = useBookingForm({
    editBooking,
    selectedDate,
    selectedTime,
    selectedStaffId,
    selectedServiceId,
    isEditMode,
    onDateChange,
    onTimeChange,
    onStaffChange,
    onServiceChange,
  });

  // Customer search hook
  const customerSearch = useCustomerSearch({
    customerPhone: form.customerPhone,
    customers,
    onPhoneChange: form.setCustomerPhone,
    onNameChange: form.setCustomerName,
  });

  // 수정 모드일 때 기존 고객 정보 설정
  useMemo(() => {
    if (isEditMode && editBooking?.customerId) {
      customerSearch.setSelectedCustomer({
        id: editBooking.customerId,
        name: editBooking.customerName || '',
        phone: editBooking.customerPhone || '',
      });
    }
  }, [isEditMode, editBooking]);

  // 선택된 직원 이름
  const selectedStaffName = useMemo(() => {
    const staff = artists.find((d) => d.value === form.currentStaffId);
    return staff?.label || '';
  }, [artists, form.currentStaffId]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    form.resetForm();
    customerSearch.setSelectedCustomer(null);
    setSelectedServiceIds([]);
    setIsServiceInitialized(false);
    onClose();
  }, [form, customerSearch, onClose]);

  // 서비스 초기화 (수정 모드 또는 선택된 서비스)
  useEffect(() => {
    if (isOpen && !isServiceInitialized) {
      if (isEditMode && editBooking) {
        // booking_meta.service_ids가 있으면 복수 서비스 복원, 없으면 단일 serviceId
        const metaServiceIds = editBooking.bookingMeta?.service_ids;
        if (Array.isArray(metaServiceIds) && metaServiceIds.length > 0) {
          setSelectedServiceIds(metaServiceIds);
        } else if (editBooking.serviceId) {
          setSelectedServiceIds([editBooking.serviceId]);
        }
      } else if (selectedServiceId) {
        setSelectedServiceIds([selectedServiceId]);
      } else {
        setSelectedServiceIds([]);
      }
      setIsServiceInitialized(true);
    }

    if (!isOpen && isServiceInitialized) {
      setIsServiceInitialized(false);
      setSelectedServiceIds([]);
    }
  }, [isOpen, isServiceInitialized, isEditMode, editBooking?.serviceId, selectedServiceId]);

  // form.currentServiceId 동기화
  useEffect(() => {
    const primaryServiceId = selectedServiceIds[0] ?? '';
    if (form.currentServiceId !== primaryServiceId) {
      form.handleServiceChange(primaryServiceId);
    }
  }, [selectedServiceIds, form.currentServiceId, form.handleServiceChange]);

  // 서비스 추가 핸들러
  const handleServiceAdd = useCallback(
    (serviceId: string) => {
      setSelectedServiceIds((prev) => [...prev, serviceId]);
      if (form.errors.service) {
        form.setErrors((prev) => ({ ...prev, service: '' }));
      }
    },
    [form]
  );

  // 카테고리 그룹 전체 삭제
  const handleRemoveCategoryServices = useCallback(
    (categoryId: string) => {
      setSelectedServiceIds((prev) =>
        prev.filter((id) => menuMap[id]?.category_id !== categoryId)
      );
    },
    [menuMap]
  );

  // Booking save hook
  const bookingSave = useBookingSave({
    salonId,
    editBooking,
    isEditMode,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerType: form.customerType,
    notes: form.notes,
    currentDate: form.currentDate,
    currentTime: form.currentTime,
    currentStaffId: form.currentStaffId,
    selectedStaffName,
    selectedServices,
    categoryMap,
    onClose: handleClose,
    validateForm: form.validateForm,
    selectedCustomer: customerSearch.selectedCustomer,
  });

  // 예약 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!editBooking?.id) return;
    try {
      await deleteBooking(editBooking.id);
      setShowDeleteConfirm(false);
      handleClose();
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  }, [editBooking, deleteBooking, handleClose]);

  const isLoading = bookingSave.isCreating || bookingSave.isUpdating || bookingSave.isCreatingCustomer || isDeleting;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditMode ? t('booking.detail') : t('booking.new')}
        size="lg"
      >
        <form className="space-y-4 text-secondary-800" onSubmit={bookingSave.handleSubmit}>
          {/* 고객 정보 섹션 */}
          <CustomerSection
            customerName={form.customerName}
            customerPhone={form.customerPhone}
            customerType={form.customerType}
            errors={form.errors}
            selectedCustomer={customerSearch.selectedCustomer}
            showCustomerDropdown={customerSearch.showCustomerDropdown}
            matchingCustomers={customerSearch.matchingCustomers}
            dropdownRef={customerSearch.dropdownRef}
            onNameChange={form.setCustomerName}
            onPhoneChange={customerSearch.handlePhoneChange}
            onTypeChange={form.setCustomerType}
            onSelectCustomer={customerSearch.handleSelectCustomer}
            onClearCustomer={customerSearch.handleClearCustomer}
            onClearErrors={(field) => form.setErrors((prev) => ({ ...prev, [field]: '' }))}
            onPhoneFocus={customerSearch.handlePhoneFocus}
          />

          {/* 직원 선택 */}
          <div>
            <Select
              label={t('booking.designer')}
              required
              options={artists}
              value={form.currentStaffId}
              onChange={form.handleStaffChange}
              error={form.errors.staff}
              className="text-secondary-900 focus:ring-primary-500"
            />
          </div>

          {/* 서비스 선택 */}
          <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3 md:p-4">
            <label className="block text-sm font-medium text-secondary-800 mb-2">
              {t('booking.service')} <span className="text-error-500">*</span>
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
                      onClick={() => handleRemoveCategoryServices(group.categoryId)}
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
                    {totalServiceDuration}min / ฿{totalServicePrice.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <ServiceSelector
              salonId={salonId}
              selectedServiceIds={selectedServiceIds}
              onServiceAdd={handleServiceAdd}
            />
            {form.errors.service && (
              <p className="mt-1 text-xs text-error-500">{form.errors.service}</p>
            )}
          </div>

          {/* 날짜 */}
          <BookingDatePicker
            label={t('booking.date')}
            required
            value={form.currentDate}
            onChange={form.setDate}
          />

          {/* 시간 선택 (어드민: 항상 30분 단위, 영업시간 기반) */}
          <TimeSlotSelector
            label={t('booking.time')}
            required
            value={form.currentTime}
            onChange={form.setTime}
            businessHours={businessHours}
            selectedDate={form.currentDate}
            error={form.errors.time}
          />

          {/* 시술메모 */}
          <div>
            <label className="block text-sm font-medium text-secondary-800 mb-1">
              {t('booking.notes')}
            </label>
            <textarea
              placeholder={t('booking.placeholders.notesPlaceholder')}
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm text-secondary-900 placeholder:text-secondary-500"
            />
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-between pt-4">
            {/* 삭제 버튼 (수정 모드에서만 표시) */}
            <div>
              {isEditMode && (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  {t('common.delete')}
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                type="button"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 신규 고객 확인 다이얼로그 */}
      <NewCustomerConfirmModal
        isOpen={bookingSave.showNewCustomerConfirm}
        onClose={() => bookingSave.setShowNewCustomerConfirm(false)}
        onConfirm={bookingSave.handleConfirmNewCustomer}
        customerName={form.customerName}
        customerPhone={form.customerPhone}
        isLoading={isLoading}
      />

      {/* 예약 삭제 확인 다이얼로그 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('booking.deleteConfirm.title')}
        description={t('booking.deleteConfirm.description')}
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}

export const NewBookingModal = memo(NewBookingModalComponent);
