'use client';

import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn, formatDate } from '@/lib/utils';
import { BusinessHours } from '@/types';
import { DAY_KEYS, DAY_SHORT_TRANSLATION_KEYS } from './utils';

interface CalendarDropdownProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  businessHours: BusinessHours[];
}

export const CalendarDropdown = memo(function CalendarDropdown({
  selectedDate,
  onDateChange,
  businessHours,
}: CalendarDropdownProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부에서 selectedDate가 바뀌면 viewDate도 해당 월로 이동
  useEffect(() => {
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // 영업시간 기준 휴무 요일 (0=일 ~ 6=토)
  const closedWeekdays = useMemo(
    () => new Set(businessHours.filter((bh) => !bh.isOpen).map((bh) => bh.dayOfWeek)),
    [businessHours]
  );

  // 헤더 월/년 표시
  const monthLabel = useMemo(() => {
    const intlLocale = locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : 'ko-KR';
    return new Intl.DateTimeFormat(intlLocale, { year: 'numeric', month: 'long' }).format(viewDate);
  }, [viewDate, locale]);

  // 달력 날짜 그리드 생성
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay(); // 0=일
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewDate]);

  const selectedKey = formatDate(selectedDate, 'yyyy-MM-dd');
  const todayKey = formatDate(new Date(), 'yyyy-MM-dd');

  const handlePrevMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const handleSelect = useCallback(
    (date: Date) => {
      onDateChange(date);
      setIsOpen(false);
    },
    [onDateChange]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* 아이콘 트리거 */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={t('booking.openCalendar')}
        aria-expanded={isOpen}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
          isOpen
            ? 'border-primary-400 bg-primary-50 text-primary-500'
            : 'border-secondary-200 text-secondary-400 hover:bg-secondary-50'
        )}
      >
        <CalendarDays size={13} />
      </button>

      {/* 달력 패널 */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl border border-secondary-200 shadow-xl z-dropdown p-4">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label={t('booking.prevMonth')}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-secondary-900">{monthLabel}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label={t('booking.nextMonth')}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 요일 헤더 (일~토) */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_KEYS.map((key, i) => (
              <div
                key={key}
                className={cn(
                  'text-center text-xs py-1 font-semibold',
                  i === 0 ? 'text-error-600' : i === 6 ? 'text-info-600' : 'text-secondary-600'
                )}
              >
                {t(DAY_SHORT_TRANSLATION_KEYS[key])}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const key = formatDate(date, 'yyyy-MM-dd');
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;
              const dow = date.getDay();
              const isClosed = closedWeekdays.has(dow);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(date)}
                  className={cn(
                    'relative flex flex-col items-center justify-center h-9 rounded-lg text-xs font-medium transition-colors mx-0.5',
                    isSelected
                      ? 'bg-primary-500 text-white font-bold'
                      : isToday
                      ? 'bg-primary-50 text-primary-600 font-bold ring-1 ring-primary-300'
                      : isClosed
                      ? 'text-secondary-300 hover:bg-secondary-50'
                      : dow === 0
                      ? 'text-error-500 hover:bg-error-50'
                      : dow === 6
                      ? 'text-info-500 hover:bg-info-50'
                      : 'text-secondary-700 hover:bg-secondary-50'
                  )}
                >
                  <span className="leading-none">{date.getDate()}</span>
                  {isClosed && !isSelected && (
                    <span className="text-[8px] leading-none text-secondary-300 mt-0.5">
                      {t('booking.closedDayNotice')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
