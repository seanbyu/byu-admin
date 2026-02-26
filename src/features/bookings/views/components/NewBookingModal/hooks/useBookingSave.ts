import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBookings } from '../../../../hooks/useBookings';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { BookingStatus } from '@/types';
import { Booking } from '../../../../types';
import { CustomerType, ExistingCustomer } from '../types';

interface ServiceInfo {
  id: string;
  name: string;
  category_id: string;
  duration_minutes?: number;
  base_price?: number;
  price?: number;
}

interface UseBookingSaveProps {
  salonId: string;
  editBooking?: Booking;
  isEditMode: boolean;
  // Form values
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  notes: string;
  // Current values
  currentDate: Date;
  currentTime: string;
  currentStaffId: string;
  selectedStaffName: string;
  // Service info
  selectedServices: ServiceInfo[];
  categoryMap: Record<string, string>;
  // Callbacks
  onClose: () => void;
  validateForm: () => boolean;
  // Customer
  selectedCustomer: ExistingCustomer | null;
}

interface UseBookingSaveReturn {
  isCreating: boolean;
  isUpdating: boolean;
  isCreatingCustomer: boolean;
  showNewCustomerConfirm: boolean;
  setShowNewCustomerConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleConfirmNewCustomer: () => Promise<void>;
}

// Date 객체를 UTC 변환 없이 로컬 기준 YYYY-MM-DD 문자열로 직렬화
// (JSON.stringify 시 UTC로 변환되어 날짜가 하루 밀리는 버그 방지)
function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useBookingSave({
  salonId,
  editBooking,
  isEditMode,
  customerName,
  customerPhone,
  customerType,
  notes,
  currentDate,
  currentTime,
  currentStaffId,
  selectedStaffName,
  selectedServices,
  categoryMap,
  onClose,
  validateForm,
  selectedCustomer,
}: UseBookingSaveProps): UseBookingSaveReturn {
  const t = useTranslations();
  const { createBooking, updateBooking, isCreating, isUpdating } = useBookings(salonId);
  const { createCustomer, isCreating: isCreatingCustomer } = useCustomers({ salon_id: salonId });

  const [showNewCustomerConfirm, setShowNewCustomerConfirm] = useState(false);

  // 시간 계산 헬퍼 함수
  const calculateEndTime = useCallback(
    (startTime: string, durationMinutes: number): string => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;
      return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    },
    []
  );

  // 선택된 서비스들의 카테고리명 조합 (중복 제거)
  const getCategoryServiceName = useCallback(
    (services: ServiceInfo[]) => {
      const categoryNames = [...new Set(
        services.map((s) => categoryMap[s.category_id] || s.name)
      )];
      return categoryNames.join(', ');
    },
    [categoryMap]
  );

  // 실제 예약 저장 로직
  const saveBooking = useCallback(
    async (customerId: string) => {
      if (selectedServices.length === 0) return;

      const primaryService = selectedServices[0];
      const durationMinutes = selectedServices.reduce(
        (sum, service) => sum + (service.duration_minutes || 60),
        0
      );
      const servicePrice = selectedServices.reduce(
        (sum, service) => sum + (service.base_price || service.price || 0),
        0
      );
      const endTime = calculateEndTime(currentTime, durationMinutes);
      const serviceName = getCategoryServiceName(selectedServices);
      const finalNotes = notes.trim() || undefined;

      const serviceIds = selectedServices.map((s) => s.id);

      await createBooking({
        salonId,
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerType === 'foreign' ? '' : customerPhone.trim(),
        staffId: currentStaffId,
        staffName: selectedStaffName,
        serviceId: primaryService.id,
        serviceName,
        serviceIds,
        bookingMeta: {
          channel: 'admin',
          category_name: serviceName,
          service_ids: serviceIds,
        },
        date: toLocalDateStr(currentDate),
        startTime: currentTime,
        endTime,
        status: BookingStatus.CONFIRMED,
        price: servicePrice,
        source: 'WALK_IN',
        notes: finalNotes,
        productAmount: 0,
        storeSalesAmount: 0,
      } as any);

      onClose();
    },
    [
      selectedServices,
      calculateEndTime,
      currentTime,
      getCategoryServiceName,
      createBooking,
      salonId,
      customerName,
      customerType,
      customerPhone,
      currentStaffId,
      selectedStaffName,
      currentDate,
      notes,
      onClose,
    ]
  );

  // 예약 수정 로직
  const handleUpdateBooking = useCallback(async () => {
    if (!editBooking || selectedServices.length === 0) return;

    const primaryService = selectedServices[0];
    const durationMinutes = selectedServices.reduce(
      (sum, service) => sum + (service.duration_minutes || 60),
      0
    );
    const servicePrice = selectedServices.reduce(
      (sum, service) => sum + (service.base_price || service.price || 0),
      0
    );
    const endTime = calculateEndTime(currentTime, durationMinutes);
    const serviceName = getCategoryServiceName(selectedServices);
    const finalNotes = notes.trim() || undefined;

    const serviceIds = selectedServices.map((s) => s.id);

    await updateBooking({
      id: editBooking.id,
      updates: {
        staffId: currentStaffId,
        serviceId: primaryService.id,
        serviceName,
        serviceIds,
        date: toLocalDateStr(currentDate),
        startTime: currentTime,
        endTime,
        price: servicePrice,
        notes: finalNotes,
        // 기존 booking_meta 보존 (sales_registered 등)
        bookingMeta: {
          ...(editBooking.bookingMeta || {}),
          category_name: serviceName,
          service_ids: serviceIds,
        },
      } as Partial<Booking> & { serviceIds?: string[]; bookingMeta?: Record<string, any> },
    });

    onClose();
  }, [
    editBooking,
    selectedServices,
    calculateEndTime,
    currentTime,
    getCategoryServiceName,
    updateBooking,
    currentStaffId,
    currentDate,
    notes,
    onClose,
  ]);

  // 신규 고객 확인 후 저장
  const handleConfirmNewCustomer = useCallback(async () => {
    try {
      const customerResult = (await createCustomer({
        salon_id: salonId,
        name: customerName.trim(),
        phone: customerType === 'foreign' ? '' : customerPhone.trim(),
        notes: customerType === 'foreign' ? 'Foreign customer' : undefined,
      })) as { data?: { id?: string } };

      const customerId = customerResult?.data?.id;
      if (!customerId) {
        throw new Error('Failed to create customer');
      }

      await saveBooking(customerId);
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert(t('common.error'));
    }
  }, [createCustomer, salonId, customerName, customerType, customerPhone, saveBooking, t]);

  // 폼 제출
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      if (selectedServices.length === 0) {
        alert(t('booking.errors.serviceRequired'));
        return;
      }

      try {
        if (isEditMode) {
          await handleUpdateBooking();
          return;
        }

        if (selectedCustomer) {
          await saveBooking(selectedCustomer.id);
          return;
        }

        if (customerType === 'foreign') {
          await handleConfirmNewCustomer();
          return;
        }

        setShowNewCustomerConfirm(true);
      } catch (error) {
        console.error('Failed to create booking:', error);
        alert(t('common.error'));
      }
    },
    [
      validateForm,
      selectedServices,
      isEditMode,
      handleUpdateBooking,
      selectedCustomer,
      customerType,
      saveBooking,
      handleConfirmNewCustomer,
      t,
    ]
  );

  return {
    isCreating,
    isUpdating,
    isCreatingCustomer,
    showNewCustomerConfirm,
    setShowNewCustomerConfirm,
    handleSubmit,
    handleConfirmNewCustomer,
  };
}
