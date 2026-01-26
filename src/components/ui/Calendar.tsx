'use client';

import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ko, enUS, th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from './Button';

const DATE_LOCALES = {
  ko,
  en: enUS,
  th,
} as const;

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  time: string;
  color?: string;
  resourceId?: string;
}

interface ResourceWorkHours {
  dayOfWeek: number; // 0: 일요일, 1: 월요일, ..., 6: 토요일
  openTime: string;  // "09:00"
  closeTime: string; // "20:00"
  isOpen: boolean;
}

interface Resource {
  id: string;
  label: string;
  workHours?: ResourceWorkHours[];
}

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string, resourceId?: string) => void;
  resources?: Resource[];
}

type ViewType = 'month' | 'day';

export function Calendar({ selectedDate, onDateSelect, events = [], onEventClick, onTimeSlotClick, resources = [] }: CalendarProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] || enUS;

  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  const [viewType, setViewType] = React.useState<ViewType>('month');
  const [currentDate, setCurrentDate] = React.useState(selectedDate);

  // 외부 selectedDate prop 변경 시 내부 상태 동기화
  React.useEffect(() => {
    setCurrentDate(selectedDate);
    setCurrentMonth(selectedDate);
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = [
    t('shortDayNames.sun'),
    t('shortDayNames.mon'),
    t('shortDayNames.tue'),
    t('shortDayNames.wed'),
    t('shortDayNames.thu'),
    t('shortDayNames.fri'),
    t('shortDayNames.sat'),
  ];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const previousDay = () => {
    const newDate = addDays(currentDate, -1);
    setCurrentDate(newDate);
    onDateSelect(newDate);
  };

  const nextDay = () => {
    const newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
    onDateSelect(newDate);
  };

  // 08:00 ~ 22:00 시간 슬롯 (15시간)
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = (i + 8).toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const getDayEvents = () => {
    return events.filter(event => isSameDay(event.date, currentDate));
  };

  // 특정 직원의 특정 시간 슬롯 상태 확인
  // 반환값: 'available' | 'unavailable' | 'dayOff'
  const getSlotStatus = (resource: Resource, date: Date, time: string): 'available' | 'unavailable' | 'dayOff' => {
    if (!resource.workHours || resource.workHours.length === 0) {
      return 'available'; // workHours가 없으면 기본적으로 예약 가능
    }

    const dayOfWeek = date.getDay(); // 0: 일요일, 1: 월요일, ...
    const workHoursForDay = resource.workHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (!workHoursForDay || !workHoursForDay.isOpen) {
      return 'dayOff'; // 해당 요일 휴무
    }

    const hour = parseInt(time.split(':')[0]);
    const openHour = parseInt(workHoursForDay.openTime.split(':')[0]);
    const closeHour = parseInt(workHoursForDay.closeTime.split(':')[0]);

    if (hour >= openHour && hour < closeHour) {
      return 'available';
    }
    return 'unavailable'; // 근무일이지만 업무 시간 외
  };

  const renderDayView = () => {
    const dayEvents = getDayEvents();

    // 리소스(직원)가 있을 경우 직원별 타임라인 뷰 렌더링
    if (resources.length > 0) {
      return (
        <div className="p-4">
          {/* 헤더: 날짜 + 직원 컬럼 */}
          <div className="flex border-b border-secondary-200">
            <div className="w-20 flex-shrink-0 py-3 px-2 text-center font-semibold text-secondary-900 border-r border-secondary-200">
              {format(currentDate, 'M/d (E)', { locale: dateLocale })}
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${resources.length}, minmax(120px, 1fr))` }}>
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="py-3 px-2 text-center font-semibold text-secondary-900 border-r border-secondary-200 last:border-r-0"
                >
                  {resource.label}
                </div>
              ))}
            </div>
          </div>

          {/* 바디: 시간축 + 직원별 격자 */}
          <div className="overflow-y-auto max-h-[600px] overflow-x-auto">
            {timeSlots.map((time) => {
              const hour = parseInt(time.split(':')[0]);

              return (
                <div key={time} className="flex border-b border-secondary-100">
                  {/* 시간축 */}
                  <div className="w-20 flex-shrink-0 py-3 px-2 text-sm text-secondary-600 text-right border-r border-secondary-200">
                    {time}
                  </div>
                  {/* 직원별 셀 */}
                  <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${resources.length}, minmax(120px, 1fr))` }}>
                    {resources.map((resource) => {
                      const resourceEvents = dayEvents.filter(event => {
                        const eventHour = parseInt(event.time.split(':')[0]);
                        return eventHour === hour && event.resourceId === resource.id;
                      });

                      const slotStatus = getSlotStatus(resource, currentDate, time);
                      const isAvailable = slotStatus === 'available';

                      return (
                        <div
                          key={resource.id}
                          className={`py-2 px-2 min-h-[60px] relative border-r border-secondary-100 last:border-r-0 ${
                            isAvailable
                              ? 'cursor-pointer transition-colors hover:bg-blue-50'
                              : 'bg-secondary-100 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (isAvailable && resourceEvents.length === 0) {
                              onTimeSlotClick?.(currentDate, time, resource.id);
                            }
                          }}
                        >
                          {isAvailable ? (
                            <>
                              {resourceEvents.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-xs text-secondary-400">+</span>
                                </div>
                              )}
                              {resourceEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className={`mb-1 p-2 rounded cursor-pointer text-xs ${event.color || 'bg-primary-100 text-primary-700'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick?.(event);
                                  }}
                                >
                                  <div className="font-medium">{event.time}</div>
                                  <div className="truncate">{event.title}</div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-secondary-400">
                                {slotStatus === 'dayOff' ? t('calendar.dayOff') : t('calendar.unavailable')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 기존 단일 컬럼 뷰
    return (
      <div className="p-4">
        <div className="flex border-b border-secondary-200">
          <div className="w-20 flex-shrink-0"></div>
          <div className="flex-1 text-center py-3 font-semibold text-secondary-900">
            {format(currentDate, 'PPP', { locale: dateLocale })}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {timeSlots.map((time) => {
            const hour = parseInt(time.split(':')[0]);
            const timeEvents = dayEvents.filter(event => {
              const eventHour = parseInt(event.time.split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={time} className="flex border-b border-secondary-100">
                <div className="w-20 flex-shrink-0 py-3 px-2 text-sm text-secondary-600 text-right">
                  {time}
                </div>
                <div
                  className="flex-1 py-2 px-3 min-h-[60px] relative cursor-pointer transition-colors hover:bg-blue-50"
                  onClick={() => {
                    if (timeEvents.length === 0) {
                      onTimeSlotClick?.(currentDate, time);
                    }
                  }}
                >
                  {timeEvents.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-xs text-secondary-400">{t('calendar.addBooking')}</span>
                    </div>
                  )}
                  {timeEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`mb-1 p-2 rounded cursor-pointer ${event.color || 'bg-primary-100 text-primary-700'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="font-medium text-sm">{event.time}</div>
                      <div className="text-sm">{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-secondary-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const dayOfWeek = day.getDay();

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-secondary-50'
                } ${
                  isSelected ? 'border-primary-500 bg-primary-50' : 'border-secondary-200'
                } hover:border-primary-300`}
                onClick={() => onDateSelect(day)}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    !isCurrentMonth ? 'text-secondary-400' :
                    isToday ? 'text-white bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center' :
                    dayOfWeek === 0 ? 'text-red-500' :
                    dayOfWeek === 6 ? 'text-blue-500' :
                    'text-secondary-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${
                        event.color || 'bg-primary-100 text-primary-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={`${event.time} - ${event.title}`}
                    >
                      {event.time} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-secondary-500 pl-1">
                      +{dayEvents.length - 3} {t('calendar.more')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-secondary-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-secondary-900">
            {viewType === 'month'
              ? format(currentMonth, 'LLLL yyyy', { locale: dateLocale })
              : format(currentDate, 'PPP', { locale: dateLocale })
            }
          </h2>
          <div className="flex border border-secondary-200 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1.5 flex items-center space-x-1 text-sm transition-colors ${
                viewType === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50'
              }`}
              onClick={() => setViewType('month')}
            >
              <CalendarRange size={16} />
              <span>{t('calendar.month')}</span>
            </button>
            <button
              className={`px-3 py-1.5 flex items-center space-x-1 text-sm transition-colors ${
                viewType === 'day'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50'
              }`}
              onClick={() => setViewType('day')}
            >
              <CalendarDays size={16} />
              <span>{t('calendar.day')}</span>
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={viewType === 'month' ? previousMonth : previousDay}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={viewType === 'month' ? nextMonth : nextDay}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewType === 'month' ? renderMonthView() : renderDayView()}
    </div>
  );
}
