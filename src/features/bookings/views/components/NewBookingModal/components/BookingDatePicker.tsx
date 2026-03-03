'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DayPicker, useDayPicker, type CalendarMonth } from 'react-day-picker';
import { useLocale } from 'next-intl';
import { ko, enUS, th, type Locale } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-day-picker/style.css';

const LOCALES = { ko, en: enUS, th };

// ─── 커스텀 캡션: < 2026년 3월 > 레이아웃 ───
function CalendarCaption({
  calendarMonth,
  dateLocale,
  captionFormat,
}: {
  calendarMonth: CalendarMonth;
  dateLocale: Locale;
  captionFormat: string;
}) {
  const { goToMonth, nextMonth, previousMonth } = useDayPicker();

  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="p-1 rounded-lg hover:bg-secondary-100 transition-colors disabled:opacity-30"
      >
        <ChevronLeft size={16} className="text-secondary-600" />
      </button>

      <span className="text-sm font-semibold text-secondary-800">
        {format(calendarMonth.date, captionFormat, { locale: dateLocale })}
      </span>

      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="p-1 rounded-lg hover:bg-secondary-100 transition-colors disabled:opacity-30"
      >
        <ChevronRight size={16} className="text-secondary-600" />
      </button>
    </div>
  );
}

interface BookingDatePickerProps {
  label?: string;
  required?: boolean;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function BookingDatePicker({
  label,
  required,
  value,
  onChange,
  error,
}: BookingDatePickerProps) {
  const locale = useLocale() as keyof typeof LOCALES;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // 모달 스크롤 시 달력 닫기 (input과 달력이 분리되는 현상 방지)
    const handleScroll = () => setOpen(false);

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true); // capture: 모달 내부 스크롤도 감지
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const handleSelect = useCallback(
    (day: Date | undefined) => {
      if (day) {
        onChange(day);
        setOpen(false);
      }
    },
    [onChange]
  );

  const dateLocale = LOCALES[locale] ?? ko;
  const displayFormat = locale === 'en' ? 'MMM d, yyyy' : 'yyyy-MM-dd';
  const captionFormat = locale === 'en' ? 'MMMM yyyy' : locale === 'th' ? 'MMMM yyyy' : 'yyyy년 M월';

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary-800 mb-2">
          {label}
          {required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}

      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors text-left',
          'text-secondary-900 bg-white',
          open
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-secondary-300 hover:border-primary-400',
          error && 'border-error-500 ring-2 ring-error-500/20'
        )}
      >
        <CalendarDays size={15} className="text-secondary-400 shrink-0" />
        <span>{format(value, displayFormat, { locale: dateLocale })}</span>
      </button>

      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}

      {/* 달력 팝오버 */}
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-secondary-200 rounded-xl shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleSelect}
            locale={dateLocale}
            defaultMonth={value}
            components={{
              Nav: () => <></>, // 기본 Nav 숨김 (캡션에 통합)
              MonthCaption: ({ calendarMonth }) => (
                <CalendarCaption
                  calendarMonth={calendarMonth}
                  dateLocale={dateLocale}
                  captionFormat={captionFormat}
                />
              ),
            }}
            classNames={{
              month_caption: '',
              month_grid: 'w-full border-collapse',
              weekdays: 'text-xs text-secondary-400 font-medium',
              weekday: 'text-center py-1 w-9',
              day: 'w-9 h-9 text-sm text-center',
              day_button: cn(
                'w-9 h-9 rounded-lg text-sm transition-colors',
                'hover:bg-primary-50 hover:text-primary-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-400'
              ),
              selected: '[&>button]:!bg-primary-500 [&>button]:!text-white [&>button]:font-semibold',
              today: '[&>button]:font-bold [&>button]:text-primary-600',
              outside: '[&>button]:text-secondary-300',
              disabled: '[&>button]:text-secondary-200 [&>button]:cursor-not-allowed',
            }}
          />
        </div>
      )}
    </div>
  );
}
