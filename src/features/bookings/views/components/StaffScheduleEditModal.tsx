'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BusinessHours, Holiday } from '@/types';
import { Staff } from '@/features/staff/types';
import { RotateCcw, Check } from 'lucide-react';
import { createStaffApi } from '@/features/staff/api';
import { salonsApi } from '@/features/salons/api';
import { getDefaultWorkHours } from '../../utils';
import { WorkHoursEditor, HolidayManager } from './schedule';

interface StaffScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  salonId: string;
  onSave?: () => void;
}

export function StaffScheduleEditModal({
  isOpen,
  onClose,
  staff,
  salonId,
  onSave,
}: StaffScheduleEditModalProps) {
  const t = useTranslations();
  const [workHours, setWorkHours] = useState<BusinessHours[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 매장 설정 가져오기 (영업시간)
  const { data: settingsResponse } = useQuery({
    queryKey: ['salonSettings', salonId],
    queryFn: () => salonsApi.getSettings(salonId),
    enabled: isOpen && !!salonId,
    staleTime: 5 * 60 * 1000,
  });

  const salonBusinessHours = useMemo(
    () => settingsResponse?.data?.businessHours || [],
    [settingsResponse?.data?.businessHours]
  );

  // 모달 열릴 때 직원 데이터로 초기화
  useEffect(() => {
    if (isOpen && staff) {
      if (staff.workHours && staff.workHours.length > 0) {
        setWorkHours(staff.workHours);
      } else {
        setWorkHours(getDefaultWorkHours(salonBusinessHours));
      }
      setHolidays(staff.holidays || []);
      setSaveSuccess(false);
    }
  }, [isOpen, staff, salonBusinessHours]);

  // 매장이 해당 요일에 휴무인지 확인
  const isSalonClosedOnDay = useCallback((dayOfWeek: number): boolean => {
    if (!salonBusinessHours || salonBusinessHours.length === 0) return false;
    const salonDay = salonBusinessHours.find((sh) => sh.dayOfWeek === dayOfWeek);
    return salonDay ? !salonDay.isOpen : false;
  }, [salonBusinessHours]);

  // 매장 기본값으로 초기화
  const handleResetToSalonDefaults = useCallback(() => {
    if (salonBusinessHours && salonBusinessHours.length > 0) {
      setWorkHours(getDefaultWorkHours(salonBusinessHours));
    }
  }, [salonBusinessHours]);

  const handleToggleDay = useCallback((dayOfWeek: number) => {
    if (isSalonClosedOnDay(dayOfWeek)) return;

    setWorkHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, isOpen: !wh.isOpen } : wh
      )
    );
  }, [isSalonClosedOnDay]);

  const handleTimeChange = useCallback((
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setWorkHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
      )
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!staff.id || !salonId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const adjustedWorkHours = workHours.map((wh) => {
        if (isSalonClosedOnDay(wh.dayOfWeek)) {
          return { ...wh, isOpen: false };
        }
        return wh;
      });

      const staffApi = createStaffApi();
      await staffApi.updateStaff(salonId, staff.id, {
        workHours: adjustedWorkHours,
        holidays,
      });
      setSaveSuccess(true);
      onSave?.();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to save staff schedule:', error);
    } finally {
      setIsSaving(false);
    }
  }, [staff.id, salonId, workHours, holidays, isSalonClosedOnDay, onSave, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${staff.name} - ${t('staff.schedule.title')}`}
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* 업무 시간 설정 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-secondary-700">
              {t('staff.schedule.workHours')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToSalonDefaults}
              disabled={salonBusinessHours.length === 0}
            >
              <RotateCcw size={14} className="mr-1" />
              {t('staff.schedule.resetToSalonDefaults')}
            </Button>
          </div>
          <p className="text-xs text-secondary-500 mb-3">
            {t('staff.schedule.workHoursHint')}
          </p>
          <WorkHoursEditor
            workHours={workHours}
            onToggleDay={handleToggleDay}
            onTimeChange={handleTimeChange}
            isSalonClosedOnDay={isSalonClosedOnDay}
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
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-secondary-200">
        {saveSuccess && (
          <span className="flex items-center gap-1 text-sm text-success-600 mr-2">
            <Check size={16} />
            {t('common.saved')}
          </span>
        )}
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </Modal>
  );
}
