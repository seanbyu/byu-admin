import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBookings } from '../../../../hooks/useBookings';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { BookingStatus } from '@/types';
import { Booking } from '../../../../types';
import { toLocalDateStr, calculateEndTime } from '../../../../utils';
import {
  ServiceInfo,
  UseBookingSaveProps,
  UseBookingSaveReturn,
} from '../types';

function buildBookingPayload(
  services: ServiceInfo[],
  currentTime: string,
  categoryMap: Record<string, string>
) {
  const primaryServiceId = services[0]?.id ?? '';
  const durationMinutes = services.reduce(
    (sum, s) => sum + (s.duration_minutes || 60),
    0
  );
  const servicePrice = services.reduce(
    (sum, s) => sum + (s.base_price || s.price || 0),
    0
  );
  const endTime = calculateEndTime(currentTime, durationMinutes);
  const categoryNames = [...new Set(
    services.map((s) => categoryMap[s.category_id] || s.name)
  )];
  const serviceName = categoryNames.join(', ');
  const serviceIds = services.map((s) => s.id);

  return { primaryServiceId, servicePrice, endTime, serviceName, serviceIds };
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

  // 실제 예약 저장 로직
  const saveBooking = useCallback(
    async (customerId: string) => {
      if (selectedServices.length === 0) return;

      const { primaryServiceId, servicePrice, endTime, serviceName, serviceIds } =
        buildBookingPayload(selectedServices, currentTime, categoryMap);
      const finalNotes = notes.trim() || undefined;

      await createBooking({
        salonId,
        customerId,
        customerName: customerName.trim(),
        customerPhone: customerType === 'foreign' ? '' : customerPhone.trim(),
        staffId: currentStaffId,
        staffName: selectedStaffName,
        serviceId: primaryServiceId,
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
      currentTime,
      categoryMap,
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

    const { primaryServiceId, servicePrice, endTime, serviceName, serviceIds } =
      buildBookingPayload(selectedServices, currentTime, categoryMap);
    const finalNotes = notes.trim() || undefined;

    await updateBooking({
      id: editBooking.id,
      updates: {
        staffId: currentStaffId,
        serviceId: primaryServiceId,
        serviceName,
        serviceIds,
        date: toLocalDateStr(currentDate),
        startTime: currentTime,
        endTime,
        price: servicePrice,
        notes: finalNotes,
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
    currentTime,
    categoryMap,
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
