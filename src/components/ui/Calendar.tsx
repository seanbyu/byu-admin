'use client';

import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns';
import { ko, enUS, th } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from './Button';
import { cn } from '@/lib/utils';

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
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface Resource {
  id: string;
  label: string;
  workHours?: ResourceWorkHours[];
}

interface SalonBusinessHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string, resourceId?: string) => void;
  resources?: Resource[];
  slotDuration?: number;
  salonBusinessHours?: SalonBusinessHours[];
}

type ViewType = 'month' | 'day';

export function Calendar({
  selectedDate,
  onDateSelect,
  events = [],
  onEventClick,
  onTimeSlotClick,
  resources = [],
  slotDuration = 60,
  salonBusinessHours = [],
}: CalendarProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] || enUS;

  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  const [viewType, setViewType] = React.useState<ViewType>('month');
  const [currentDate, setCurrentDate] = React.useState(selectedDate);

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
    return events.filter((event) => isSameDay(event.date, day));
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

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

  // Get salon business hours for a specific day
  const getSalonHoursForDay = React.useCallback(
    (date: Date): SalonBusinessHours | null => {
      if (!salonBusinessHours || salonBusinessHours.length === 0) return null;
      const dayOfWeek = date.getDay();
      return salonBusinessHours.find((bh) => bh.dayOfWeek === dayOfWeek) || null;
    },
    [salonBusinessHours]
  );

  // Check if a time slot is within salon operating hours
  const isWithinSalonHours = React.useCallback(
    (date: Date, time: string): boolean => {
      const salonHours = getSalonHoursForDay(date);
      if (!salonHours) return true; // No salon hours set, allow all
      if (!salonHours.isOpen) return false; // Salon closed on this day

      const [h, m] = time.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const [oh, om] = salonHours.openTime.split(':').map(Number);
      const openMinutes = oh * 60 + om;
      const [ch, cm] = salonHours.closeTime.split(':').map(Number);
      const closeMinutes = ch * 60 + cm;

      return slotMinutes >= openMinutes && slotMinutes < closeMinutes;
    },
    [getSalonHoursForDay]
  );

  const timeSlots = React.useMemo(() => {
    const slots: string[] = [];
    // Default range 8:00 - 22:00, but we'll show all and disable based on salon hours
    const startMinutes = 8 * 60;
    const endMinutes = 22 * 60;
    for (let m = startMinutes; m < endMinutes; m += slotDuration) {
      const hour = Math.floor(m / 60)
        .toString()
        .padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      slots.push(`${hour}:${min}`);
    }
    return slots;
  }, [slotDuration]);

  const getDayEvents = () => {
    return events.filter((event) => isSameDay(event.date, currentDate));
  };

  const getSlotStatus = (
    resource: Resource,
    date: Date,
    time: string
  ): 'available' | 'unavailable' | 'dayOff' | 'salonClosed' => {
    // First check salon business hours
    const salonHours = getSalonHoursForDay(date);
    if (salonHours) {
      if (!salonHours.isOpen) {
        return 'salonClosed'; // Salon is closed on this day
      }
      if (!isWithinSalonHours(date, time)) {
        return 'salonClosed'; // Outside salon operating hours
      }
    }

    // Then check staff work hours
    if (!resource.workHours || resource.workHours.length === 0) {
      return 'available';
    }

    const dayOfWeek = date.getDay();
    const workHoursForDay = resource.workHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek
    );

    if (!workHoursForDay || !workHoursForDay.isOpen) {
      return 'dayOff';
    }

    const [h, m] = time.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    const [oh, om] = workHoursForDay.openTime.split(':').map(Number);
    const openMinutes = oh * 60 + om;
    const [ch, cm] = workHoursForDay.closeTime.split(':').map(Number);
    const closeMinutes = ch * 60 + cm;

    if (slotMinutes >= openMinutes && slotMinutes < closeMinutes) {
      return 'available';
    }
    return 'unavailable';
  };

  const renderDayView = () => {
    const dayEvents = getDayEvents();

    if (resources.length > 0) {
      return (
        <div className="p-4">
          {/* Header */}
          <div className="flex border-b border-secondary-200">
            <div className="w-20 flex-shrink-0 py-3 px-2 text-center font-semibold text-secondary-900 border-r border-secondary-200">
              {format(currentDate, 'M/d (E)', { locale: dateLocale })}
            </div>
            <div
              className="flex-1 grid"
              style={{
                gridTemplateColumns: `repeat(${resources.length}, minmax(120px, 1fr))`,
              }}
            >
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

          {/* Body */}
          <div className="overflow-y-auto max-h-[600px] overflow-x-auto">
            {timeSlots.map((time) => (
              <div key={time} className="flex border-b border-secondary-100">
                <div className="w-20 flex-shrink-0 py-3 px-2 text-sm text-secondary-600 text-right border-r border-secondary-200">
                  {time}
                </div>
                <div
                  className="flex-1 grid"
                  style={{
                    gridTemplateColumns: `repeat(${resources.length}, minmax(120px, 1fr))`,
                  }}
                >
                  {resources.map((resource) => {
                    const resourceEvents = dayEvents.filter(
                      (event) =>
                        event.time === time && event.resourceId === resource.id
                    );
                    const slotStatus = getSlotStatus(
                      resource,
                      currentDate,
                      time
                    );
                    const isAvailable = slotStatus === 'available';
                    const isSalonClosed = slotStatus === 'salonClosed';

                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          'py-2 px-2 min-h-[60px] relative border-r border-secondary-100 last:border-r-0',
                          'transition-colors duration-fast',
                          isAvailable
                            ? 'cursor-pointer hover:bg-primary-50'
                            : isSalonClosed
                              ? 'bg-secondary-200 cursor-not-allowed'
                              : 'bg-secondary-100 cursor-not-allowed'
                        )}
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
                                <span className="text-xs text-secondary-400">
                                  +
                                </span>
                              </div>
                            )}
                            {resourceEvents.map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  'mb-1 p-2 rounded-md cursor-pointer text-xs',
                                  event.color || 'bg-primary-100 text-primary-700'
                                )}
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
                              {isSalonClosed
                                ? t('calendar.closed')
                                : slotStatus === 'dayOff'
                                  ? t('calendar.dayOff')
                                  : t('calendar.unavailable')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Single column view
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
            const timeEvents = dayEvents.filter((event) => event.time === time);
            const withinSalonHours = isWithinSalonHours(currentDate, time);
            const salonHours = getSalonHoursForDay(currentDate);
            const isSalonClosedDay = salonHours && !salonHours.isOpen;

            return (
              <div key={time} className="flex border-b border-secondary-100">
                <div className="w-20 flex-shrink-0 py-3 px-2 text-sm text-secondary-600 text-right">
                  {time}
                </div>
                <div
                  className={cn(
                    'flex-1 py-2 px-3 min-h-[60px] relative',
                    'transition-colors duration-fast',
                    withinSalonHours
                      ? 'cursor-pointer hover:bg-primary-50'
                      : 'bg-secondary-200 cursor-not-allowed'
                  )}
                  onClick={() => {
                    if (withinSalonHours && timeEvents.length === 0) {
                      onTimeSlotClick?.(currentDate, time);
                    }
                  }}
                >
                  {withinSalonHours ? (
                    <>
                      {timeEvents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-xs text-secondary-400">
                            {t('calendar.addBooking')}
                          </span>
                        </div>
                      )}
                      {timeEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'mb-1 p-2 rounded-md cursor-pointer',
                            event.color || 'bg-primary-100 text-primary-700'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <div className="font-medium text-sm">{event.time}</div>
                          <div className="text-sm">{event.title}</div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-secondary-400">
                        {isSalonClosedDay ? t('calendar.dayOff') : t('calendar.closed')}
                      </span>
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

  const renderMonthView = () => {
    return (
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-medium py-2',
                index === 0
                  ? 'text-error-500'
                  : index === 6
                    ? 'text-info-500'
                    : 'text-secondary-600'
              )}
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
                className={cn(
                  'min-h-[100px] p-2 border rounded-lg cursor-pointer',
                  'transition-colors duration-fast',
                  isCurrentMonth ? 'bg-white' : 'bg-secondary-50',
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-200 hover:border-primary-300'
                )}
                onClick={() => onDateSelect(day)}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    !isCurrentMonth && 'text-secondary-400',
                    isToday &&
                      'text-white bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center',
                    !isToday && isCurrentMonth && dayOfWeek === 0 && 'text-error-500',
                    !isToday && isCurrentMonth && dayOfWeek === 6 && 'text-info-500',
                    !isToday &&
                      isCurrentMonth &&
                      dayOfWeek !== 0 &&
                      dayOfWeek !== 6 &&
                      'text-secondary-700'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded truncate cursor-pointer',
                        event.color || 'bg-primary-100 text-primary-700'
                      )}
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
    <div className="bg-white rounded-lg border border-secondary-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-secondary-900">
            {viewType === 'month'
              ? format(currentMonth, 'LLLL yyyy', { locale: dateLocale })
              : format(currentDate, 'PPP', { locale: dateLocale })}
          </h2>
          <div className="flex border border-secondary-200 rounded-lg overflow-hidden">
            <button
              className={cn(
                'px-3 py-1.5 flex items-center gap-1 text-sm transition-colors duration-fast',
                viewType === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50'
              )}
              onClick={() => setViewType('month')}
            >
              <CalendarRange size={16} />
              <span>{t('calendar.month')}</span>
            </button>
            <button
              className={cn(
                'px-3 py-1.5 flex items-center gap-1 text-sm transition-colors duration-fast',
                viewType === 'day'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50'
              )}
              onClick={() => setViewType('day')}
            >
              <CalendarDays size={16} />
              <span>{t('calendar.day')}</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
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
