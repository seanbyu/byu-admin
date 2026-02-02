'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { BusinessHours, Holiday } from '@/types';
import { Staff } from '@/features/staff/types';
import { Trash2, Plus, RotateCcw, Check } from 'lucide-react';
import { createStaffApi } from '@/features/staff/api';
import { salonsApi } from '@/features/salons/api';

interface StaffScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  salonId: string;
  onSave?: () => void;
}

// 요일 키 매핑
const DAY_KEYS = [
  'common.dayNames.sunday',
  'common.dayNames.monday',
  'common.dayNames.tuesday',
  'common.dayNames.wednesday',
  'common.dayNames.thursday',
  'common.dayNames.friday',
  'common.dayNames.saturday',
] as const;

// 08:00 ~ 22:00 시간 옵션
const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = (i + 8).toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// 오늘 날짜를 yyyy-MM-dd 형식으로 반환
const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultWorkHours = (salonBusinessHours?: BusinessHours[]): BusinessHours[] => {
  if (salonBusinessHours && salonBusinessHours.length > 0) {
    return salonBusinessHours.map((sh) => ({
      dayOfWeek: sh.dayOfWeek,
      openTime: sh.openTime,
      closeTime: sh.closeTime,
      isOpen: sh.isOpen,
    }));
  }
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '10:00',
    closeTime: '21:00',
    isOpen: i !== 1,
  }));
};

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

  // 새 휴가 입력 상태
  const [newHoliday, setNewHoliday] = useState({
    startDate: getTodayString(),
    endDate: '',
    reason: '',
  });

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

  const handleAddHoliday = useCallback(() => {
    if (!newHoliday.startDate || !newHoliday.endDate || !newHoliday.reason) {
      return;
    }

    const holiday: Holiday = {
      id: `holiday-${Date.now()}`,
      startDate: newHoliday.startDate,
      endDate: newHoliday.endDate,
      reason: newHoliday.reason,
    };

    setHolidays((prev) => [...prev, holiday]);
    setNewHoliday({ startDate: getTodayString(), endDate: '', reason: '' });
  }, [newHoliday]);

  const handleRemoveHoliday = useCallback((id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    if (!staff.id || !salonId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // 매장 휴무일은 직원도 자동으로 휴무 처리
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
          <div className="bg-secondary-50 rounded-lg p-4">
            <div className="space-y-3">
              {workHours
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((wh) => {
                  const salonClosed = isSalonClosedOnDay(wh.dayOfWeek);
                  return (
                    <div
                      key={wh.dayOfWeek}
                      className={`flex items-center gap-4 py-2 border-b border-secondary-200 last:border-b-0 ${
                        salonClosed ? 'opacity-60' : ''
                      }`}
                    >
                      {/* 요일 및 토글 */}
                      <div className="min-w-[120px] flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleDay(wh.dayOfWeek)}
                          disabled={salonClosed}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            salonClosed
                              ? 'bg-secondary-200 cursor-not-allowed'
                              : wh.isOpen
                                ? 'bg-primary-500'
                                : 'bg-secondary-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              wh.isOpen && !salonClosed ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium ${
                            wh.dayOfWeek === 0
                              ? 'text-red-500'
                              : wh.dayOfWeek === 6
                                ? 'text-blue-500'
                                : 'text-secondary-700'
                          }`}
                        >
                          {t(DAY_KEYS[wh.dayOfWeek])}
                        </span>
                      </div>

                      {/* 시간 선택 */}
                      {salonClosed ? (
                        <span className="text-secondary-400 text-sm flex-1">
                          {t('staff.schedule.salonClosed')}
                        </span>
                      ) : wh.isOpen ? (
                        <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                          <Select
                            options={TIME_OPTIONS}
                            value={wh.openTime}
                            onChange={(e) =>
                              handleTimeChange(wh.dayOfWeek, 'openTime', e.target.value)
                            }
                            className="w-24 sm:w-28"
                            showPlaceholder={false}
                          />
                          <span className="text-secondary-500">~</span>
                          <Select
                            options={TIME_OPTIONS}
                            value={wh.closeTime}
                            onChange={(e) =>
                              handleTimeChange(wh.dayOfWeek, 'closeTime', e.target.value)
                            }
                            className="w-24 sm:w-28"
                            showPlaceholder={false}
                          />
                        </div>
                      ) : (
                        <span className="text-secondary-400 text-sm flex-1">
                          {t('staff.schedule.closed')}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 휴가/휴무 설정 */}
        <div>
          <h3 className="text-sm font-medium text-secondary-700 mb-3">
            {t('staff.schedule.holiday')}
          </h3>
          <div className="bg-secondary-50 rounded-lg p-4">
            {/* 새 휴가 입력 */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label={t('common.form.startDate')}
                  value={newHoliday.startDate}
                  onChange={(date) =>
                    setNewHoliday((prev) => ({ ...prev, startDate: date }))
                  }
                />
                <DatePicker
                  label={t('common.form.endDate')}
                  value={newHoliday.endDate}
                  onChange={(date) =>
                    setNewHoliday((prev) => ({ ...prev, endDate: date }))
                  }
                  minDate={newHoliday.startDate ? new Date(newHoliday.startDate) : undefined}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('common.form.reason')}
                  placeholder={t('staff.schedule.reasonPlaceholder')}
                  value={newHoliday.reason}
                  onChange={(e) =>
                    setNewHoliday((prev) => ({ ...prev, reason: e.target.value }))
                  }
                />
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={handleAddHoliday}
                    className="w-full"
                    disabled={
                      !newHoliday.startDate ||
                      !newHoliday.endDate ||
                      !newHoliday.reason
                    }
                  >
                    <Plus size={16} className="mr-1" />
                    {t('common.add')}
                  </Button>
                </div>
              </div>
            </div>

            {/* 휴가 목록 */}
            {holidays.length > 0 ? (
              <div className="border-t border-secondary-200 pt-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">
                  {t('staff.schedule.holidayList')}
                </h4>
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-secondary-200"
                    >
                      <div>
                        <span className="font-medium text-secondary-900">
                          {holiday.startDate} ~ {holiday.endDate}
                        </span>
                        <span className="ml-3 text-secondary-600">
                          {holiday.reason}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHoliday(holiday.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-secondary-500 text-center py-4">
                {t('staff.schedule.noHolidays')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-secondary-200">
        {saveSuccess && (
          <span className="flex items-center gap-1 text-sm text-green-600 mr-2">
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
