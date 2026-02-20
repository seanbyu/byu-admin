'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Booking } from '../../types';
import { Staff } from '@/features/staff/types';
import { BookingStatus, BusinessHours } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';

// ============================================
// 전화번호 국가코드 제거 유틸
// ============================================
function stripCountryCode(phone: string): string {
  if (!phone) return phone;
  // +66-95-559-7077 → 095-559-7077 / +82 10-1234-5678 → 010-1234-5678
  return phone.replace(/^\+\d{1,4}[-\s]?/, '0');
}

// ============================================
// 결제수단 번역 키 맵
// ============================================
const PAYMENT_METHOD_KEYS: Record<string, string> = {
  CARD: 'booking.paymentMethodCard',
  CASH: 'booking.paymentMethodCash',
  TRANSFER: 'booking.paymentMethodTransfer',
};

// ============================================
// 시간 슬롯 생성 유틸
// ============================================

function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number
): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += slotMinutes;
  }
  return slots;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ============================================
// 인라인 가격 편집 셀
// ============================================

const InlinePriceCell = memo(function InlinePriceCell({
  bookingId,
  price,
  onUpdate,
}: {
  bookingId: string;
  price: number;
  onUpdate: (id: string, price: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(price));

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setValue(String(price));
    setEditing(true);
  }, [price]);

  const commit = useCallback(
    (raw: string) => {
      setEditing(false);
      const num = Number(raw);
      if (!isNaN(num) && num !== price) {
        onUpdate(bookingId, num);
      }
    },
    [bookingId, price, onUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
      if (e.key === 'Escape') setEditing(false);
    },
    [commit]
  );

  if (editing) {
    return (
      <input
        type="number"
        autoFocus
        className="w-full text-right border border-primary-400 rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary-500"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        min={0}
      />
    );
  }

  return (
    <span
      className="cursor-pointer hover:text-primary-600 hover:underline block text-right w-full"
      onClick={handleClick}
      title="클릭하여 수정"
    >
      {price > 0 ? formatPrice(price) : '—'}
    </span>
  );
});

// ============================================
// Props
// ============================================

interface StaffDaySheetViewProps {
  bookings: Booking[];
  staffMembers: Staff[];
  selectedDate: Date;
  businessHours: BusinessHours[];
  slotDuration: number;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (staffId: string, time?: string) => void;
  onUpdateBooking: (id: string, updates: { price: number }) => void;
}

// ============================================
// 상태 뱃지 컴포넌트
// ============================================

const STATUS_STYLES: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  [BookingStatus.CONFIRMED]: 'bg-blue-100 text-blue-700 border-blue-300',
  [BookingStatus.COMPLETED]: 'bg-green-100 text-green-700 border-green-300',
  [BookingStatus.CANCELLED]: 'bg-red-100 text-red-700 border-red-300',
  [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-700 border-gray-300',
};

const StatusBadge = memo(function StatusBadge({
  status,
  label,
}: {
  status: BookingStatus;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
});

// ============================================
// 직원별 예약 테이블 (영업시간 전체 슬롯 표시)
// ============================================

interface StaffBookingTableProps {
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (time: string) => void;
  onUpdateBooking: (id: string, updates: { price: number }) => void;
}

const StaffBookingTable = memo(function StaffBookingTable({
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
}: StaffBookingTableProps) {
  const t = useTranslations();

  const totalPrice = useMemo(
    () =>
      Object.values(bookingsByTime).reduce((sum, b) => sum + (b.price || 0), 0),
    [bookingsByTime]
  );

  const totalProductAmount = useMemo(
    () =>
      Object.values(bookingsByTime).reduce(
        (sum, b) => sum + (b.productAmount || 0),
        0
      ),
    [bookingsByTime]
  );

  const bookingCount = Object.keys(bookingsByTime).length;
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // 정규 슬롯 + 정규 슬롯 밖에 존재하는 예약 시간 병합 (정렬)
  const mergedSlots = useMemo(() => {
    const offIntervalTimes = Object.keys(bookingsByTime).filter(
      (time) => !timeSlots.includes(time)
    );
    return [...timeSlots, ...offIntervalTimes].sort();
  }, [timeSlots, bookingsByTime]);

  if (timeSlots.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-secondary-400">
        {t('booking.noBookings')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-secondary-50">
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600 w-20">
              {t('booking.time')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600 w-36">
              {t('booking.service')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600 w-28">
              {t('booking.customer')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600 w-32">
              {t('booking.phone')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600">
              {t('booking.notes')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600 w-24">
              {t('booking.status')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-right font-medium text-secondary-600 w-28">
              {t('booking.price')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-center font-medium text-secondary-600 w-32">
              {t('booking.paymentMethod')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-right font-medium text-secondary-600 w-28">
              {t('booking.productAmount')}
            </th>
            <th className="border border-secondary-200 px-3 py-2 text-left font-medium text-secondary-600 w-28">
              {t('booking.product')}
            </th>
          </tr>
        </thead>

        {/* 슬롯별 tbody — 메인 행 + 서브슬롯 행을 같은 그룹으로 묶어 깜빡임 방지 */}
        {mergedSlots.map((slot) => {
          const booking = bookingsByTime[slot];
          const subSlotTime = addMinutes(slot, 30);
          const hasSubSlot = !mergedSlots.includes(subSlotTime);
          const isHovered = hoveredSlot === slot;

          return (
            <tbody
              key={slot}
              onMouseEnter={() => setHoveredSlot(slot)}
              onMouseLeave={() => setHoveredSlot(null)}
            >
              {/* 메인 슬롯 행 */}
              {booking ? (
                <tr
                  className="hover:bg-primary-50 cursor-pointer transition-colors"
                  onClick={() => onBookingClick(booking)}
                >
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-700 font-medium">
                    {slot}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-900">
                    {booking.serviceName}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-700">
                    {booking.customerName}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-500 text-xs">
                    {booking.customerPhone ? stripCountryCode(booking.customerPhone) : '—'}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-500 text-xs max-w-[180px]">
                    <span className="truncate block">{booking.notes || '—'}</span>
                  </td>
                  <td className="border border-secondary-200 px-3 py-2">
                    <StatusBadge
                      status={booking.status}
                      label={t(`booking.${booking.status.toLowerCase()}`)}
                    />
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-700">
                    <InlinePriceCell
                      bookingId={booking.id}
                      price={booking.price}
                      onUpdate={(id, price) => onUpdateBooking(id, { price })}
                    />
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-center text-secondary-600 text-xs">
                    {booking.paymentMethod
                      ? PAYMENT_METHOD_KEYS[booking.paymentMethod]
                        ? t(PAYMENT_METHOD_KEYS[booking.paymentMethod] as any)
                        : booking.paymentMethod
                      : '—'}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-right text-secondary-700">
                    {booking.productAmount > 0 ? formatPrice(booking.productAmount) : '—'}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-600 text-xs">
                    {booking.productName || '—'}
                  </td>
                </tr>
              ) : (
                <tr
                  className="transition-colors cursor-pointer hover:bg-primary-50"
                  onClick={() => onAddBooking(slot)}
                >
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-400 font-medium h-9">
                    {slot}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2 text-secondary-300 text-xs select-none">
                    {isHovered ? `+ ${t('booking.addBooking')}` : ''}
                  </td>
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                  <td className="border border-secondary-200 px-3 py-2" />
                </tr>
              )}

              {/* 30분 서브슬롯 행 — 호버 시에만 표시, 같은 tbody 안이라 깜빡임 없음 */}
              {hasSubSlot && isHovered && (
                <tr
                  className="cursor-pointer bg-secondary-50/80 hover:bg-primary-50 transition-colors"
                  onClick={() => onAddBooking(subSlotTime)}
                >
                  <td className="border-x border-b border-secondary-200 px-3 py-1.5 text-secondary-400 text-xs font-medium">
                    <span className="text-secondary-300 mr-1">└</span>
                    {subSlotTime}
                  </td>
                  <td className="border-x border-b border-secondary-200 px-3 py-1.5 text-secondary-300 text-xs" colSpan={9}>
                    + {t('booking.addBooking')}
                  </td>
                </tr>
              )}
            </tbody>
          );
        })}

        {/* 합계 tbody */}
        {bookingCount > 0 && (
          <tbody>
            <tr className="bg-secondary-50 font-semibold">
              <td
                colSpan={6}
                className="border border-secondary-200 px-3 py-2 text-center text-sm text-secondary-600"
              >
                {t('booking.total')} ({bookingCount}{t('booking.bookingCount')})
              </td>
              <td className="border border-secondary-200 px-3 py-2 text-right text-sm font-bold text-secondary-900">
                {formatPrice(totalPrice)}
              </td>
              <td className="border border-secondary-200 px-3 py-2" />
              <td className="border border-secondary-200 px-3 py-2 text-right text-sm font-bold text-secondary-900">
                {totalProductAmount > 0 ? formatPrice(totalProductAmount) : '—'}
              </td>
              <td className="border border-secondary-200 px-3 py-2" />
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
});

// ============================================
// 직원 아코디언 아이템
// ============================================

interface StaffAccordionItemProps {
  staff: Staff;
  timeSlots: string[];
  bookingsByTime: Record<string, Booking>;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (staffId: string, time?: string) => void;
  onUpdateBooking: (id: string, updates: { price: number }) => void;
}

const StaffAccordionItem = memo(function StaffAccordionItem({
  staff,
  timeSlots,
  bookingsByTime,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
}: StaffAccordionItemProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleAddClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddBooking(staff.id);
    },
    [staff.id, onAddBooking]
  );

  const handleAddAtTime = useCallback(
    (time: string) => {
      onAddBooking(staff.id, time);
    },
    [staff.id, onAddBooking]
  );

  const bookingCount = Object.keys(bookingsByTime).length;

  const totalPrice = useMemo(
    () =>
      Object.values(bookingsByTime).reduce((sum, b) => sum + (b.price || 0), 0),
    [bookingsByTime]
  );

  return (
    <div className="border border-secondary-200 rounded-lg overflow-hidden bg-white">
      {/* 아코디언 헤더 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-secondary-50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown size={18} className="text-secondary-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-secondary-400 flex-shrink-0" />
          )}
          <span className="font-semibold text-secondary-900">{staff.name}</span>
          <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">
            {bookingCount}
            {t('booking.bookingCount')}
          </span>
          {bookingCount > 0 && (
            <span className="text-xs text-secondary-400">
              {t('booking.total')}: {formatPrice(totalPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-primary-200"
        >
          <Plus size={14} />
          {t('booking.new')}
        </button>
      </div>

      {/* 예약 테이블 (펼쳤을 때) */}
      {isOpen && (
        <div className="border-t border-secondary-200">
          <StaffBookingTable
            timeSlots={timeSlots}
            bookingsByTime={bookingsByTime}
            onBookingClick={onBookingClick}
            onAddBooking={handleAddAtTime}
            onUpdateBooking={onUpdateBooking}
          />
        </div>
      )}
    </div>
  );
});

// ============================================
// 메인 컴포넌트
// ============================================

export const StaffDaySheetView = memo(function StaffDaySheetView({
  bookings,
  staffMembers,
  selectedDate,
  businessHours,
  slotDuration,
  onBookingClick,
  onAddBooking,
  onUpdateBooking,
}: StaffDaySheetViewProps) {
  const t = useTranslations();

  // 예약 허용 직원만
  const bookingEnabledStaff = useMemo(
    () => staffMembers.filter((s) => s.isBookingEnabled),
    [staffMembers]
  );

  // 선택된 날짜의 요일에 맞는 영업시간 가져오기
  const todayBusinessHours = useMemo(() => {
    const dayOfWeek = new Date(selectedDate).getDay();
    return businessHours.find(
      (bh) => bh.dayOfWeek === dayOfWeek && bh.isOpen
    );
  }, [businessHours, selectedDate]);

  // 영업시간 기반 시간 슬롯 생성
  const timeSlots = useMemo(() => {
    if (!todayBusinessHours) return [];
    return generateTimeSlots(
      todayBusinessHours.openTime,
      todayBusinessHours.closeTime,
      slotDuration
    );
  }, [todayBusinessHours, slotDuration]);

  // 선택 날짜의 예약을 직원별 + 시간별로 그룹화
  const bookingsByStaffAndTime = useMemo(() => {
    const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
    const dayBookings = bookings.filter((b) => {
      // b.date가 "2026-02-21" 형태의 문자열이면 직접 비교 (timezone 이슈 방지)
      const bookingDateStr =
        typeof b.date === 'string'
          ? (b.date as string).slice(0, 10)
          : formatDate(b.date as Date, 'yyyy-MM-dd');
      return bookingDateStr === dateStr;
    });

    const grouped: Record<string, Record<string, Booking>> = {};
    bookingEnabledStaff.forEach((staff) => {
      grouped[staff.id] = {};
      dayBookings
        .filter((b) => b.staffId === staff.id)
        .forEach((b) => {
          const slotKey = b.startTime.slice(0, 5);
          grouped[staff.id][slotKey] = b;
        });
    });
    return grouped;
  }, [bookings, bookingEnabledStaff, selectedDate]);

  const dateLabel = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const d = new Date(selectedDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dd = d.getDate();
    const dow = days[d.getDay()];
    return `${y}년 ${m}월 ${dd}일 (${dow})`;
  }, [selectedDate]);

  if (bookingEnabledStaff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-secondary-400">
        <p>{t('booking.noStaff')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 날짜 헤더 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-secondary-600">{dateLabel}</span>
        <span className="text-xs text-secondary-400 bg-secondary-100 px-2 py-0.5 rounded-full">
          {bookingEnabledStaff.length}
          {t('booking.staffCount')}
        </span>
        {todayBusinessHours && (
          <span className="text-xs text-secondary-400">
            {todayBusinessHours.openTime} – {todayBusinessHours.closeTime}
          </span>
        )}
      </div>

      {/* 직원별 아코디언 */}
      {bookingEnabledStaff.map((staff) => (
        <StaffAccordionItem
          key={staff.id}
          staff={staff}
          timeSlots={timeSlots}
          bookingsByTime={bookingsByStaffAndTime[staff.id] || {}}
          onBookingClick={onBookingClick}
          onAddBooking={onAddBooking}
          onUpdateBooking={onUpdateBooking}
        />
      ))}
    </div>
  );
});

export default StaffDaySheetView;
