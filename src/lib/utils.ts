import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { ko as koLocale, enUS, th as thLocale } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 날짜 포맷팅
export const formatDate = (date: Date | string, formatString: string = 'yyyy-MM-dd', locale: string = 'ko') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const localeObj = locale === 'ko' ? koLocale : locale === 'th' ? thLocale : enUS;
  return format(dateObj, formatString, { locale: localeObj });
};

// 시간 포맷팅
export const formatTime = (time: string) => {
  return time; // "HH:mm" format
};

// 가격 포맷팅
export const formatPrice = (price: number, currency: string = 'THB') => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

// 전화번호 포맷팅
export const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: 02-123-4567 or 081-234-5678
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

// 고객 번호 생성
export const generateCustomerNumber = (lastNumber: string): string => {
  const num = parseInt(lastNumber || '0') + 1;
  
  if (num < 10) {
    return `0${num}`;
  } else if (num < 100) {
    return `0${num}`;
  } else if (num < 1000) {
    return `${num}`;
  } else {
    return `${num}`;
  }
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// 시간 범위 검증
export const isTimeSlotAvailable = (
  startTime: string,
  endTime: string,
  existingBookings: { startTime: string; endTime: string }[]
): boolean => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  for (const booking of existingBookings) {
    const bookingStart = timeToMinutes(booking.startTime);
    const bookingEnd = timeToMinutes(booking.endTime);

    // Check if time slots overlap
    if (
      (start >= bookingStart && start < bookingEnd) ||
      (end > bookingStart && end <= bookingEnd) ||
      (start <= bookingStart && end >= bookingEnd)
    ) {
      return false;
    }
  }

  return true;
};

// 시간을 분으로 변환
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 분을 시간으로 변환
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// 요일 이름 가져오기
export const getDayName = (dayOfWeek: number, locale: string = 'ko'): string => {
  const days = {
    ko: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    th: ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'],
  };

  return days[locale as keyof typeof days]?.[dayOfWeek] || days.en[dayOfWeek];
};

// 이미지 URL 검증
export const isValidImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
};

// 이메일 검증
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// 전화번호 검증 (태국 형식)
export const isValidThaiPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^(0[0-9]{8,9})$/.test(cleaned);
};

// 배열을 청크로 나누기
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 로컬 스토리지 유틸리티
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};
