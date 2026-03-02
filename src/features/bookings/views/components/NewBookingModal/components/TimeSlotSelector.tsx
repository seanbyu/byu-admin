'use client';

import { useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { BusinessHours } from '@/types';

// 어드민은 항상 30분 단위 고정
const ADMIN_SLOT_MINUTES = 30;

// 비즈니스 아워 미설정 시 기본 범위
const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '22:00';

function generateSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += ADMIN_SLOT_MINUTES;
  }
  return slots;
}

interface TimeSlotSelectorProps {
  value: string;
  onChange: (time: string) => void;
  businessHours: BusinessHours[];
  selectedDate: Date;
  label?: string;
  required?: boolean;
  error?: string;
}

export const TimeSlotSelector = memo(function TimeSlotSelector({
  value,
  onChange,
  businessHours,
  selectedDate,
  label,
  required,
  error,
}: TimeSlotSelectorProps) {
  const t = useTranslations('booking');

  // 선택된 날짜의 요일에 해당하는 영업시간 조회
  const todayHours = useMemo(() => {
    const dayOfWeek = selectedDate.getDay(); // 0 = 일요일
    return businessHours.find((h) => h.dayOfWeek === dayOfWeek) ?? null;
  }, [businessHours, selectedDate]);

  // 슬롯 목록 계산 (어드민: 항상 30분 단위)
  const slots = useMemo(() => {
    if (todayHours === null) {
      // 설정 없음 → 기본 범위
      return generateSlots(DEFAULT_OPEN, DEFAULT_CLOSE);
    }
    if (!todayHours.isOpen) {
      return null; // 휴무일
    }
    return generateSlots(todayHours.openTime, todayHours.closeTime);
  }, [todayHours]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-secondary-800 mb-2">
          {label}
          {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      {slots === null ? (
        // 휴무일
        <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-500">
          <span className="text-base">🚫</span>
          <span>{t('dayOffUnavailable')}</span>
        </div>
      ) : (
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-2">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onChange(slot)}
                className={`px-1.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                  value === slot
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'bg-white text-secondary-700 border-secondary-200 hover:bg-primary-50 hover:border-primary-300'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
          {value && (
            <p className="mt-2 text-xs text-primary-600 font-medium pl-0.5">
              선택된 시간: {value}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
    </div>
  );
});
