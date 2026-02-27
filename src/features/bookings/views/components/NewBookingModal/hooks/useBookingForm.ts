import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CustomerType, UseBookingFormProps, UseBookingFormReturn } from '../types';
import { Booking } from '../../../../types';

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateInputValue = (date: Date | string): string => {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useBookingForm({
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
}: UseBookingFormProps): UseBookingFormReturn {
  const t = useTranslations();

  // 폼 상태
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('local');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 수정 모드용 내부 상태
  const [internalDate, setInternalDate] = useState<Date>(selectedDate);
  const [internalTime, setInternalTime] = useState<string>(selectedTime);
  const [internalStaffId, setInternalStaffId] = useState<string>(selectedStaffId);
  const [internalServiceId, setInternalServiceId] = useState<string>(selectedServiceId);

  // 실제 사용할 값 (수정 모드: 내부 상태, 새 예약: props)
  const currentDate = isEditMode ? internalDate : selectedDate;
  const currentTime = isEditMode ? internalTime : selectedTime;
  const currentStaffId = isEditMode ? internalStaffId : selectedStaffId;
  const currentServiceId = isEditMode ? internalServiceId : selectedServiceId;

  // 수정 모드 폼 초기화
  const initializeEditForm = useCallback((booking: Booking) => {
    setCustomerName(booking.customerName || '');
    setCustomerPhone(booking.customerPhone || '');
    setNotes(booking.notes || '');
    setInternalDate(parseLocalDate(toDateInputValue(booking.date)));
    setInternalTime(booking.startTime);
    setInternalStaffId(booking.staffId);
    setInternalServiceId(booking.serviceId);
  }, []);

  // 수정 모드일 때 폼 초기화
  useEffect(() => {
    if (isEditMode && editBooking) {
      initializeEditForm(editBooking);
    }
  }, [isEditMode, editBooking, initializeEditForm]);

  // 이벤트 핸들러
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = parseLocalDate(e.target.value);
      if (isEditMode) {
        setInternalDate(newDate);
      } else {
        onDateChange(newDate);
      }
    },
    [isEditMode, onDateChange]
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const newTime = e.target.value;
      if (isEditMode) {
        setInternalTime(newTime);
      } else {
        onTimeChange(newTime);
      }
    },
    [isEditMode, onTimeChange]
  );

  const setTime = useCallback(
    (newTime: string) => {
      if (isEditMode) {
        setInternalTime(newTime);
      } else {
        onTimeChange(newTime);
      }
    },
    [isEditMode, onTimeChange]
  );

  const handleStaffChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStaffId = e.target.value;
      if (isEditMode) {
        setInternalStaffId(newStaffId);
      } else {
        onStaffChange(newStaffId);
      }
    },
    [isEditMode, onStaffChange]
  );

  const handleServiceChange = useCallback(
    (serviceId: string) => {
      if (isEditMode) {
        setInternalServiceId(serviceId);
      } else {
        onServiceChange(serviceId);
      }
    },
    [isEditMode, onServiceChange]
  );

  // 폼 초기화
  const resetForm = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerType('local');
    setNotes('');
    setErrors({});
  }, []);

  // 유효성 검증
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = t('booking.errors.nameRequired');
    }

    if (customerType === 'local' && !customerPhone.trim()) {
      newErrors.customerPhone = t('booking.errors.phoneRequired');
    }

    if (!currentStaffId) {
      newErrors.staff = t('booking.errors.staffRequired');
    }

    if (!currentServiceId) {
      newErrors.service = t('booking.errors.serviceRequired');
    }

    if (!currentTime) {
      newErrors.time = t('booking.errors.timeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerName, customerPhone, customerType, currentStaffId, currentServiceId, currentTime, t]);

  return {
    customerName,
    customerPhone,
    customerType,
    notes,
    errors,
    internalDate,
    internalTime,
    internalStaffId,
    internalServiceId,
    currentDate,
    currentTime,
    currentStaffId,
    currentServiceId,
    setCustomerName,
    setCustomerPhone,
    setCustomerType,
    setNotes,
    setErrors,
    handleDateChange,
    handleTimeChange,
    setTime,
    handleStaffChange,
    handleServiceChange,
    resetForm,
    validateForm,
    initializeEditForm,
  };
}
