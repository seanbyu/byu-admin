'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ServiceSelector } from '../ServiceSelector';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { useMenus } from '@/features/salon-menus/hooks/useSalonMenus';
import { SalonMenu } from '@/features/salon-menus/types';
import { useBookings } from '../../../hooks/useBookings';
import { NewBookingModalProps } from './types';
import { useBookingForm, useCustomerSearch, useBookingSave } from './hooks';
import { CustomerSection, NewCustomerConfirmModal, TimeSlotSelector } from './components';
import { X } from 'lucide-react';

function NewBookingModalComponent({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  businessHours,
  selectedStaffId,
  selectedServiceId,
  designers,
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
  const isPendingBooking = isEditMode && editBooking?.status === 'PENDING';

  // Data hooks
  const { customers } = useCustomers({ salon_id: salonId });
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });
  const { confirmBooking, isConfirming, deleteBooking, isDeleting } = useBookings(salonId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

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

  const menuMap = useMemo(() => {
    return new Map(
      (menus || [])
        .filter((menu) => menu.is_active)
        .map((menu) => [menu.id, menu])
    );
  }, [menus]);

  const selectedServices = useMemo<SalonMenu[]>(
    () =>
      selectedServiceIds
        .map((serviceId) => menuMap.get(serviceId))
        .filter((menu): menu is SalonMenu => Boolean(menu)),
    [selectedServiceIds, menuMap]
  );

  const selectedServiceGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        count: number;
        unitDuration: number;
        unitPrice: number;
      }
    >();

    selectedServices.forEach((service) => {
      const existing = grouped.get(service.id);
      const unitDuration = service.duration_minutes || 60;
      const unitPrice = service.base_price || service.price || 0;

      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(service.id, {
          id: service.id,
          name: service.name,
          count: 1,
          unitDuration,
          unitPrice,
        });
      }
    });

    return Array.from(grouped.values());
  }, [selectedServices]);

  const totalServiceDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + (service.duration_minutes || 60),
        0
      ),
    [selectedServices]
  );

  const totalServicePrice = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + (service.base_price || service.price || 0),
        0
      ),
    [selectedServices]
  );

  // 선택된 직원 이름
  const selectedStaffName = useMemo(() => {
    const staff = designers.find((d) => d.value === form.currentStaffId);
    return staff?.label || '';
  }, [designers, form.currentStaffId]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    form.resetForm();
    customerSearch.setSelectedCustomer(null);
    setSelectedServiceIds([]);
    setIsServiceInitialized(false);
    onClose();
  }, [form, customerSearch, onClose]);

  useEffect(() => {
    if (isOpen && !isServiceInitialized) {
      if (isEditMode && editBooking?.serviceId) {
        setSelectedServiceIds([editBooking.serviceId]);
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

  useEffect(() => {
    const primaryServiceId = selectedServiceIds[0] ?? '';
    if (form.currentServiceId !== primaryServiceId) {
      form.handleServiceChange(primaryServiceId);
    }
  }, [selectedServiceIds, form.currentServiceId, form.handleServiceChange]);

  const handleServiceAdd = useCallback(
    (serviceId: string) => {
      setSelectedServiceIds((prev) => [...prev, serviceId]);
      if (form.errors.service) {
        form.setErrors((prev) => ({ ...prev, service: '' }));
      }
    },
    [form]
  );

  const handleRemoveService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const index = prev.indexOf(serviceId);
      if (index < 0) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  }, []);

  const handleRemoveAllService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.filter((selectedServiceId) => selectedServiceId !== serviceId)
    );
  }, []);

  // 예약 확정 핸들러
  const handleConfirm = useCallback(async () => {
    if (!editBooking?.id) return;
    try {
      await confirmBooking(editBooking.id);
      handleClose();
    } catch (error) {
      console.error('Failed to confirm booking:', error);
    }
  }, [editBooking, confirmBooking, handleClose]);

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

  const isLoading = bookingSave.isCreating || bookingSave.isUpdating || bookingSave.isCreatingCustomer || isConfirming || isDeleting;

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
              options={designers}
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
              <div className="mb-3 space-y-1.5 rounded-lg border border-primary-200 bg-white p-2.5">
                {selectedServiceGroups.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-md bg-primary-50 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary-700 truncate">
                        {service.name} x{service.count}
                      </p>
                      <p className="text-xs text-secondary-600">
                        {service.unitDuration * service.count}min / ฿{(service.unitPrice * service.count).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleServiceAdd(service.id)}
                        className="h-7 w-7 rounded-md border border-primary-300 bg-white text-primary-600 text-sm font-semibold hover:bg-primary-100"
                        aria-label="Add one more service"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service.id)}
                        className="h-7 w-7 rounded-md border border-primary-300 bg-white text-primary-600 text-sm font-semibold hover:bg-primary-100"
                        aria-label="Remove one service"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllService(service.id)}
                        className="h-7 w-7 rounded-md border border-primary-300 bg-white text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                        aria-label="Delete selected service item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-primary-100 pt-2 text-xs text-secondary-700">
                  <span>총 {selectedServices.length}개 서비스</span>
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
          <Input
            type="date"
            label={t('booking.date')}
            required
            value={formatDate(form.currentDate, 'yyyy-MM-dd')}
            onChange={form.handleDateChange}
            className="text-secondary-900 placeholder:text-secondary-500 focus:ring-primary-500"
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

          {/* 메모 */}
          <Input
            label={t('booking.notes')}
            placeholder={t('booking.placeholders.notesPlaceholder')}
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
            className="text-secondary-900 placeholder:text-secondary-500 focus:ring-primary-500"
          />

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
              {isPendingBooking && (
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  {isConfirming ? t('common.saving') : t('booking.confirmBooking')}
                </Button>
              )}
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
