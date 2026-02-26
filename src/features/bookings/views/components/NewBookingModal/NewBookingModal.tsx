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
import { useMenus, useCategories } from '@/features/salon-menus/hooks/useSalonMenus';
import { SalonMenu } from '@/features/salon-menus/types';
import { useBookings } from '../../../hooks/useBookings';
import { NewBookingModalProps } from './types';
import { useBookingForm, useCustomerSearch, useBookingSave } from './hooks';
import { CustomerSection, NewCustomerConfirmModal, TimeSlotSelector } from './components';
import { ServiceSelector } from '../ServiceSelector';

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

  // Data hooks
  const { customers } = useCustomers({ salon_id: salonId });
  const { menus } = useMenus(salonId, undefined, { enabled: !!salonId });
  const { categories } = useCategories(salonId);
  const { deleteBooking, isDeleting } = useBookings(salonId);

  // 카테고리 맵: categoryId → categoryName
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => { map[cat.id] = cat.name; });
    return map;
  }, [categories]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

  // 메뉴 맵: menuId → SalonMenu
  const menuMap = useMemo(() => {
    const map: Record<string, SalonMenu> = {};
    (menus || []).forEach((menu) => { map[menu.id] = menu; });
    return map;
  }, [menus]);

  // 선택된 서비스 목록 (중복 포함, useBookingSave에 전달)
  const selectedServices = useMemo<SalonMenu[]>(() => {
    return selectedServiceIds
      .map((id) => menuMap[id])
      .filter((menu): menu is SalonMenu => Boolean(menu));
  }, [selectedServiceIds, menuMap]);

  // 카테고리별 그룹 표시 (Cut x2, Perm x1 등)
  const selectedServiceGroups = useMemo(() => {
    const groups: { categoryId: string; categoryName: string; count: number; totalDuration: number; totalPrice: number }[] = [];
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
          categoryName: categoryMap[catId] || menu.name,
          count: 1,
          totalDuration: menu.duration_minutes || 60,
          totalPrice: menu.base_price || menu.price || 0,
        });
      }
    });

    return groups;
  }, [selectedServiceIds, menuMap, categoryMap]);

  const totalServiceDuration = useMemo(
    () => selectedServiceGroups.reduce((sum, g) => sum + g.totalDuration, 0),
    [selectedServiceGroups]
  );
  const totalServicePrice = useMemo(
    () => selectedServiceGroups.reduce((sum, g) => sum + g.totalPrice, 0),
    [selectedServiceGroups]
  );

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
                        {group.totalDuration}min / ฿{group.totalPrice.toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryServices(group.categoryId)}
                      className="h-7 w-7 rounded-md border border-primary-300 bg-white text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                      aria-label="Remove category services"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-primary-100 pt-2 text-xs text-secondary-700">
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
