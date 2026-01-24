import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from './Button';

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  time: string;
  color?: string;
}

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

type ViewType = 'month' | 'day';

export function Calendar({ selectedDate, onDateSelect, events = [], onEventClick, onTimeSlotClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  const [viewType, setViewType] = React.useState<ViewType>('month');
  const [currentDate, setCurrentDate] = React.useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

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

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const getDayEvents = () => {
    return events.filter(event => isSameDay(event.date, currentDate));
  };

  const renderDayView = () => {
    const dayEvents = getDayEvents();

    return (
      <div className="p-4">
        <div className="flex border-b border-secondary-200">
          <div className="w-20 flex-shrink-0"></div>
          <div className="flex-1 text-center py-3 font-semibold text-secondary-900">
            {format(currentDate, 'M월 d일 (E)', { locale: ko })}
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
                      <span className="text-xs text-secondary-400">예약 추가하기</span>
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
                      +{dayEvents.length - 3} 더보기
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
              ? format(currentMonth, 'yyyy년 M월', { locale: ko })
              : format(currentDate, 'yyyy년 M월 d일', { locale: ko })
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
              <span>월</span>
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
              <span>일</span>
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
