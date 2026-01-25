'use client';

import { memo, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/utils';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime: string;
  selectedStaffId: string;
  designers: Array<{ value: string; label: string }>;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  onStaffChange: (staffId: string) => void;
}

// rerender-memo: 모달 컴포넌트 메모이제이션
function NewBookingModalComponent({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  selectedStaffId,
  designers,
  onDateChange,
  onTimeChange,
  onStaffChange,
}: NewBookingModalProps) {
  const t = useTranslations();

  // 이벤트 핸들러 메모이제이션
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(new Date(e.target.value));
  }, [onDateChange]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(e.target.value);
  }, [onTimeChange]);

  const handleStaffChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStaffChange(e.target.value);
  }, [onStaffChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 예약 생성 로직 구현
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('booking.new')}
      size="lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('customer.name')}
            required
            placeholder={t('booking.placeholders.customerName')}
          />
          <Input
            label={t('customer.phone')}
            required
            placeholder="010-0000-0000"
          />
        </div>

        <Select
          label={t('booking.designer')}
          required
          options={designers}
          value={selectedStaffId}
          onChange={handleStaffChange}
        />

        <Select
          label={t('booking.service')}
          required
          options={[
            { value: 'sv1', label: t('booking.sampleServices.cut') },
            { value: 'sv2', label: t('booking.sampleServices.color') },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label={t('booking.date')}
            required
            value={formatDate(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
          />
          <Input
            type="time"
            label={t('booking.time')}
            required
            value={selectedTime}
            onChange={handleTimeChange}
          />
        </div>

        <Input
          label={t('booking.notes')}
          placeholder={t('booking.placeholders.notesPlaceholder')}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit">
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export const NewBookingModal = memo(NewBookingModalComponent);
export default NewBookingModal;
