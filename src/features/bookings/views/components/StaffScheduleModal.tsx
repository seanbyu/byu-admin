'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { Select } from '@/components/ui/Select';
import { BusinessHours, Holiday } from '@/types';
import { Staff } from '@/features/staff/types';
import { createStaffApi } from '@/features/staff/api';
import { getDefaultWorkHours } from '../../utils';
import { WorkHoursEditor, HolidayManager } from './schedule';

interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  staffList: Staff[];
  onSave?: () => void;
  salonBusinessHours?: BusinessHours[];
}

export function StaffScheduleModal({
  isOpen,
  onClose,
  salonId,
  staffList,
  onSave,
  salonBusinessHours,
}: StaffScheduleModalProps) {
  const t = useTranslations();
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [workHours, setWorkHours] = useState<BusinessHours[]>(getDefaultWorkHours(salonBusinessHours));
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  // 직원 선택 시 데이터 로드
  useEffect(() => {
    if (selectedStaff) {
      if (selectedStaff.workHours && selectedStaff.workHours.length > 0) {
        setWorkHours(selectedStaff.workHours);
      } else {
        setWorkHours(getDefaultWorkHours(salonBusinessHours));
      }
      setHolidays(selectedStaff.holidays || []);
    } else {
      setWorkHours(getDefaultWorkHours(salonBusinessHours));
      setHolidays([]);
    }
  }, [selectedStaff, salonBusinessHours]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedStaffId('');
      setWorkHours(getDefaultWorkHours(salonBusinessHours));
      setHolidays([]);
    }
  }, [isOpen, salonBusinessHours]);

  const handleToggleDay = (dayOfWeek: number) => {
    setWorkHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, isOpen: !wh.isOpen } : wh
      )
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setWorkHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
      )
    );
  };

  const handleSave = async () => {
    if (!selectedStaffId || !salonId) return;

    setIsSaving(true);
    try {
      const staffApi = createStaffApi();
      await staffApi.updateStaff(salonId, selectedStaffId, {
        workHours,
        holidays,
      });
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save staff schedule:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const staffOptions = staffList.map((staff) => ({
    value: staff.id,
    label: staff.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('staff.schedule.title')}
      size="lg"
      footer={
        <ModalActions
          onCancel={onClose}
          onSave={handleSave}
          isSaving={isSaving}
          saveDisabled={!selectedStaffId}
        />
      }
    >
      <div className="space-y-6">
        {/* 직원 선택 */}
        <div>
          <Select
            label={t('staff.schedule.selectStaff')}
            placeholder={t('staff.schedule.selectStaffPlaceholder')}
            options={staffOptions}
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          />
        </div>

        {selectedStaffId ? (
          <>
            {/* 업무 시간 설정 */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">
                {t('staff.schedule.workHours')}
              </h3>
              <WorkHoursEditor
                workHours={workHours}
                onToggleDay={handleToggleDay}
                onTimeChange={handleTimeChange}
              />
            </div>

            {/* 휴가/휴무 설정 */}
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">
                {t('staff.schedule.holiday')}
              </h3>
              <HolidayManager
                holidays={holidays}
                onAddHoliday={(holiday) => setHolidays((prev) => [...prev, holiday])}
                onRemoveHoliday={(id) => setHolidays((prev) => prev.filter((h) => h.id !== id))}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-secondary-500">
            {t('staff.schedule.selectToSetSchedule')}
          </div>
        )}
      </div>

    </Modal>
  );
}
