'use client';

import { memo, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ServiceSelector } from '../ServiceSelector';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { useMenus } from '@/features/salon-menus/hooks/useSalonMenus';
import { NewBookingModalProps } from './types';
import { useBookingForm, useCustomerSearch, useBookingSave } from './hooks';
import { CustomerSection, NewCustomerConfirmModal } from './components';

function NewBookingModalComponent({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
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

  // Data hooks
  const { customers } = useCustomers({ salon_id: salonId });
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });

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

  // 선택된 서비스 정보
  const selectedService = useMemo(() => {
    if (!form.currentServiceId || !menus) return null;
    return menus.find((menu) => menu.id === form.currentServiceId) || null;
  }, [form.currentServiceId, menus]);

  // 선택된 직원 이름
  const selectedStaffName = useMemo(() => {
    const staff = designers.find((d) => d.value === form.currentStaffId);
    return staff?.label || '';
  }, [designers, form.currentStaffId]);

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    form.resetForm();
    customerSearch.setSelectedCustomer(null);
    onClose();
  }, [form, customerSearch, onClose]);

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
    currentServiceId: form.currentServiceId,
    selectedStaffName,
    selectedService,
    onClose: handleClose,
    validateForm: form.validateForm,
    selectedCustomer: customerSearch.selectedCustomer,
  });

  const isLoading = bookingSave.isCreating || bookingSave.isUpdating || bookingSave.isCreatingCustomer;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEditMode ? t('booking.detail') : t('booking.new')}
        size="lg"
      >
        <form className="space-y-4" onSubmit={bookingSave.handleSubmit}>
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
            />
          </div>

          {/* 서비스 선택 */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('booking.service')} <span className="text-red-500">*</span>
            </label>
            <ServiceSelector
              salonId={salonId}
              selectedServiceId={form.currentServiceId}
              onServiceChange={form.handleServiceChange}
            />
            {form.errors.service && (
              <p className="mt-1 text-xs text-red-500">{form.errors.service}</p>
            )}
          </div>

          {/* 날짜 / 시간 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label={t('booking.date')}
              required
              value={formatDate(form.currentDate, 'yyyy-MM-dd')}
              onChange={form.handleDateChange}
            />
            <div>
              <Input
                type="time"
                label={t('booking.time')}
                required
                value={form.currentTime}
                onChange={form.handleTimeChange}
                error={form.errors.time}
              />
            </div>
          </div>

          {/* 메모 */}
          <Input
            label={t('booking.notes')}
            placeholder={t('booking.placeholders.notesPlaceholder')}
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
          />

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
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
    </>
  );
}

export const NewBookingModal = memo(NewBookingModalComponent);
