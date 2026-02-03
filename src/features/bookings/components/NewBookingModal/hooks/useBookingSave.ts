import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBookings } from '../../../hooks/useBookings';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { BookingStatus } from '@/types';
import { Booking } from '../../../types';
import { CustomerType, ExistingCustomer } from '../types';

interface ServiceInfo {
  id: string;
  name: string;
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
  currentServiceId: string;
  selectedStaffName: string;
  // Service info
  selectedService: ServiceInfo | null;
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
  currentServiceId,
  selectedStaffName,
  selectedService,
  onClose,
  validateForm,
  selectedCustomer,
}: UseBookingSaveProps): UseBookingSaveReturn {
  const t = useTranslations();
  const { createBooking, updateBooking, isCreating, isUpdating } = useBookings(salonId);
  const { createCustomer, isCreating: isCreatingCustomer } = useCustomers(salonId);

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

  // 실제 예약 저장 로직
  const saveBooking = useCallback(
    async (customerId: string) => {
      if (!selectedService) return;

      const durationMinutes = selectedService.duration_minutes || 60;
      const servicePrice = selectedService.base_price || selectedService.price || 0;
      const endTime = calculateEndTime(currentTime, durationMinutes);

      await createBooking({
        salonId,
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerType === 'foreign' ? '' : customerPhone.trim(),
        staffId: currentStaffId,
        staffName: selectedStaffName,
        serviceId: currentServiceId,
        serviceName: selectedService.name,
        date: currentDate,
        startTime: currentTime,
        endTime,
        status: BookingStatus.CONFIRMED,
        price: servicePrice,
        source: 'WALK_IN',
        notes: notes.trim() || undefined,
      });

      onClose();
    },
    [
      selectedService,
      calculateEndTime,
      currentTime,
      createBooking,
      salonId,
      customerName,
      customerType,
      customerPhone,
      currentStaffId,
      selectedStaffName,
      currentServiceId,
      currentDate,
      notes,
      onClose,
    ]
  );

  // 예약 수정 로직
  const handleUpdateBooking = useCallback(async () => {
    if (!editBooking || !selectedService) return;

    const durationMinutes = selectedService.duration_minutes || 60;
    const servicePrice = selectedService.base_price || selectedService.price || 0;
    const endTime = calculateEndTime(currentTime, durationMinutes);

    await updateBooking({
      id: editBooking.id,
      updates: {
        staffId: currentStaffId,
        serviceId: currentServiceId,
        date: currentDate,
        startTime: currentTime,
        endTime,
        price: servicePrice,
        notes: notes.trim() || undefined,
      },
    });

    onClose();
  }, [
    editBooking,
    selectedService,
    calculateEndTime,
    currentTime,
    updateBooking,
    currentStaffId,
    currentServiceId,
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

      if (!selectedService) {
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
      selectedService,
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
