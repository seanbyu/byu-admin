'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { BusinessHours, Holiday } from '@/types';
import { Trash2, Plus } from 'lucide-react';
import { salonsApi } from '@/features/salons/api';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  onSave?: () => void;
}

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const getDefaultBusinessHours = (): BusinessHours[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '10:00',
    closeTime: '20:00',
    isOpen: i !== 0, // 일요일은 기본 휴무
  }));
};

export function ShopSettingsModal({
  isOpen,
  onClose,
  salonId,
  onSave,
}: ShopSettingsModalProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(getDefaultBusinessHours());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 새 휴무일 입력 상태
  const [newHoliday, setNewHoliday] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  // 데이터 로드
  useEffect(() => {
    if (isOpen && salonId) {
      loadSettings();
    }
  }, [isOpen, salonId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await salonsApi.getSettings(salonId);
      if (response.success && response.data) {
        if (response.data.businessHours?.length > 0) {
          setBusinessHours(response.data.businessHours);
        }
        if (response.data.holidays) {
          setHolidays(response.data.holidays);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setBusinessHours((prev) =>
      prev.map((bh) =>
        bh.dayOfWeek === dayOfWeek ? { ...bh, isOpen: !bh.isOpen } : bh
      )
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setBusinessHours((prev) =>
      prev.map((bh) =>
        bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh
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
    if (!salonId) return;

    setIsSaving(true);
    try {
      await salonsApi.updateSettings(salonId, {
        businessHours,
        holidays,
      });
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save shop settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="샵 영업 설정" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary-500">로딩 중...</div>
        </div>
      ) : (
        <>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* 영업 시간 설정 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                영업 시간 설정
              </h3>
              <Card className="p-4">
                <div className="space-y-3">
                  {businessHours
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((bh) => (
                      <div
                        key={bh.dayOfWeek}
                        className="flex items-center gap-4 py-2 border-b border-secondary-100 last:border-b-0"
                      >
                        {/* 요일 및 토글 */}
                        <div className="w-24 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleDay(bh.dayOfWeek)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              bh.isOpen ? 'bg-primary-500' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                bh.isOpen ? 'right-1' : 'left-1'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-sm font-medium ${
                              bh.dayOfWeek === 0
                                ? 'text-red-500'
                                : bh.dayOfWeek === 6
                                  ? 'text-blue-500'
                                  : 'text-secondary-700'
                            }`}
                          >
                            {DAY_NAMES[bh.dayOfWeek]}
                          </span>
                        </div>

                        {/* 시간 선택 */}
                        {bh.isOpen ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Select
                              options={TIME_OPTIONS}
                              value={bh.openTime}
                              onChange={(e) =>
                                handleTimeChange(bh.dayOfWeek, 'openTime', e.target.value)
                              }
                              className="w-28"
                            />
                            <span className="text-secondary-500">~</span>
                            <Select
                              options={TIME_OPTIONS}
                              value={bh.closeTime}
                              onChange={(e) =>
                                handleTimeChange(bh.dayOfWeek, 'closeTime', e.target.value)
                              }
                              className="w-28"
                            />
                          </div>
                        ) : (
                          <span className="text-secondary-400 text-sm">휴무</span>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            {/* 휴무일 설정 */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                휴무일 설정
              </h3>
              <Card className="p-4">
                {/* 새 휴무일 입력 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <Input
                    type="date"
                    label="시작일"
                    value={newHoliday.startDate}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    label="종료일"
                    value={newHoliday.endDate}
                    onChange={(e) =>
                      setNewHoliday((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                  <Input
                    label="사유"
                    placeholder="예: 설 연휴"
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
                      추가
                    </Button>
                  </div>
                </div>

                {/* 휴무일 목록 */}
                {holidays.length > 0 ? (
                  <div className="border-t border-secondary-200 pt-4">
                    <h4 className="text-sm font-medium text-secondary-700 mb-3">
                      휴무일 설정 내역
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
                    등록된 휴무일이 없습니다
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-secondary-200">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
