'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { BusinessHours, Holiday } from '@/types';
import { Staff } from '@/features/staff/types';
import { Trash2, Plus } from 'lucide-react';
import { createStaffApi } from '@/features/staff/api';

interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  staffList: Staff[];
  onSave?: () => void;
  salonBusinessHours?: BusinessHours[];
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

// 08:00 ~ 22:00 시간 옵션 (15개)
const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = (i + 8).toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const getDefaultWorkHours = (salonBusinessHours?: BusinessHours[]): BusinessHours[] => {
  // If salon business hours are provided, use them as default
  if (salonBusinessHours && salonBusinessHours.length > 0) {
    return salonBusinessHours.map((sh) => ({
      dayOfWeek: sh.dayOfWeek,
      openTime: sh.openTime,
      closeTime: sh.closeTime,
      isOpen: sh.isOpen,
    }));
  }
  // Fallback to hardcoded defaults
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '10:00',
    closeTime: '21:00',
    isOpen: i !== 1, // Monday off by default
  }));
};

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

  // 새 휴가 입력 상태
  const [newHoliday, setNewHoliday] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

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
      setNewHoliday({ startDate: '', endDate: '', reason: '' });
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

  const handleAddHoliday = () => {
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
    setNewHoliday({ startDate: '', endDate: '', reason: '' });
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('staff.schedule.title')} size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
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
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {t('staff.schedule.workHours')}
              </h3>
              <Card className="p-4">
                <div className="space-y-3">
                  {workHours
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((wh) => (
                      <div
                        key={wh.dayOfWeek}
                        className="flex items-center gap-4 py-2 border-b border-secondary-100 last:border-b-0"
                      >
                        {/* 요일 및 토글 */}
                        <div className="min-w-[120px] flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleDay(wh.dayOfWeek)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              wh.isOpen ? 'bg-primary-500' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                wh.isOpen ? 'right-1' : 'left-1'
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
                        {wh.isOpen ? (
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
                          <span className="text-secondary-400 text-sm flex-1">{t('staff.schedule.closed')}</span>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            {/* 휴가/휴무 설정 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {t('staff.schedule.holiday')}
              </h3>
              <Card className="p-4">
                {/* 새 휴가 입력 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <Input
                    type="date"
                    label={t('common.form.startDate')}
                    value={newHoliday.startDate}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    label={t('common.form.endDate')}
                    value={newHoliday.endDate}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
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
                          className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
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
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-secondary-500">
            {t('staff.schedule.selectToSetSchedule')}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-secondary-200">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!selectedStaffId || isSaving}
        >
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </Modal>
  );
}
