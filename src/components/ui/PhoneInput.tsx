'use client';

import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

// 국가 코드 데이터
const COUNTRY_CODES = [
  { code: '+82', country: 'KR', flag: '🇰🇷', name: '한국' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'ไทย' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA' },
] as const;

type CountryCode = typeof COUNTRY_CODES[number];

// 국가코드 찾기 헬퍼
const findCountryByCode = (code: string): CountryCode => {
  return COUNTRY_CODES.find(c => c.code === code) || COUNTRY_CODES[0];
};

// 전화번호에서 국가코드와 로컬번호를 분리하는 함수
const parsePhoneNumber = (phone: string, defaultCode: string = '+82'): { countryCode: CountryCode; localNumber: string } => {
  const defaultCountry = findCountryByCode(defaultCode);

  if (!phone) {
    return { countryCode: defaultCountry, localNumber: '' };
  }

  // 기존 국제 형식 (+로 시작) - 하위 호환
  if (phone.startsWith('+')) {
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

    for (const country of sortedCodes) {
      if (phone.startsWith(country.code)) {
        let localNumber = phone.slice(country.code.length).replace(/^[-\s]/, '');

        // 태국 번호의 경우 표시용으로 앞에 0 추가 (저장된 값에는 0이 없음)
        if (country.code === '+66' && localNumber && !localNumber.startsWith('0')) {
          localNumber = '0' + localNumber;
        }

        return { countryCode: country, localNumber };
      }
    }
  }

  // 숫자만 있는 형식 - 기본 국가코드 사용
  return { countryCode: defaultCountry, localNumber: phone };
};

// 숫자만 추출하여 저장 (국가코드/대시 제외, 웹과 동일한 형식)
const formatForSave = (_countryCode: string, localNumber: string): string => {
  if (!localNumber) return '';
  return localNumber.replace(/\D/g, '');
};

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  label?: string;
  placeholder?: string;
  error?: string;
  defaultCountryCode?: string; // 기본 국가코드 (예: '+66', '+82')
  disabled?: boolean;
  compact?: boolean; // 모바일에서 패딩 축소
}

export const PhoneInput = memo(function PhoneInput({
  value,
  onChange,
  onFocus,
  label,
  placeholder = '010-0000-0000',
  error,
  defaultCountryCode = '+82',
  disabled = false,
  compact = false,
}: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 전화번호 파싱 (국가코드 + 로컬번호 분리)
  const { countryCode: parsedCountry, localNumber } = useMemo(
    () => parsePhoneNumber(value, defaultCountryCode),
    [value, defaultCountryCode]
  );

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 선택된 국가코드 상태 (value가 비어있을 때도 유지)
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(parsedCountry);

  // value가 변경되면 파싱된 국가코드로 업데이트
  useEffect(() => {
    if (value) {
      setSelectedCountryCode(parsedCountry);
    }
  }, [value, parsedCountry]);

  // 실제 표시할 국가코드 (value가 있으면 파싱된 값, 없으면 선택된 값)
  const displayCountry = value ? parsedCountry : selectedCountryCode;

  // 전화번호 자동 포맷팅 함수
  const formatPhoneWithDashes = useCallback((digits: string, countryCode: string): string => {
    // 숫자만 추출
    const numbers = digits.replace(/\D/g, '');

    if (countryCode === '+82') {
      // 한국: 010-XXXX-XXXX 또는 010-XXX-XXXX
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 10) {
        // 10자리: 010-XXX-XXXX
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      } else {
        // 11자리: 010-XXXX-XXXX
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
    } else if (countryCode === '+66') {
      // 태국: 0XX-XXX-XXXX (10자리)
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    } else {
      // 기타 국가: 기본 포맷
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    }
  }, []);

  // 표시용 포맷팅된 로컬번호
  const displayLocalNumber = useMemo(() => {
    if (!localNumber) return '';
    return formatPhoneWithDashes(localNumber, displayCountry.code);
  }, [localNumber, displayCountry.code, formatPhoneWithDashes]);

  // 국가 선택 핸들러 - 국가코드 변경 시 전체 값 업데이트
  const handleCountrySelect = useCallback((country: CountryCode) => {
    setShowDropdown(false);
    setSelectedCountryCode(country);
    // 로컬번호가 있으면 새 국가코드와 조합하여 저장 (0 제거 처리 포함)
    if (localNumber) {
      const formatted = formatForSave(country.code, localNumber);
      onChange(formatted);
    }
  }, [localNumber, onChange]);

  // 전화번호 입력 핸들러 - 선택된 국가코드 포함하여 저장
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 추출
    const digitsOnly = e.target.value.replace(/\D/g, '');
    if (digitsOnly.length > 11) {
      return; // 11자리 초과 시 입력 무시
    }

    if (digitsOnly) {
      // value가 있으면 기존 국가코드 유지, 없으면 선택된 국가코드 사용
      const countryCode = value ? parsedCountry.code : selectedCountryCode.code;
      // 자동 포맷팅 적용
      const formattedLocal = formatPhoneWithDashes(digitsOnly, countryCode);
      // 저장 시 앞의 0 제거 (태국 번호)
      const formatted = formatForSave(countryCode, formattedLocal);
      onChange(formatted);
    } else {
      onChange('');
    }
  }, [value, parsedCountry.code, selectedCountryCode.code, onChange, formatPhoneWithDashes]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-secondary-800">
          {label}
        </label>
      )}
      <div
        className={`flex rounded-[var(--input-radius)] border transition-colors ${
          error ? 'border-error-500 focus-within:ring-2 focus-within:ring-error-500' : 'border-secondary-300 focus-within:ring-2 focus-within:ring-primary-500'
        } ${disabled ? 'bg-secondary-100 opacity-60' : 'bg-white'} focus-within:border-transparent`}
      >
        {/* 국가 코드 선택기 */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            className={`flex items-center gap-1 px-[var(--input-px)] ${compact ? 'py-1.5 sm:py-[var(--input-py)]' : 'py-[var(--input-py)]'} border-r border-secondary-300 rounded-l-md transition-colors min-w-[90px] ${
              disabled
                ? 'bg-secondary-100 cursor-not-allowed'
                : 'bg-secondary-50 hover:bg-secondary-100'
            }`}
          >
            <span className={compact ? 'text-base' : 'text-lg'}>{displayCountry.flag}</span>
            <span className={`text-sm ${disabled ? 'text-secondary-400' : 'text-secondary-700'}`}>{displayCountry.code}</span>
            <ChevronDown size={14} className="text-secondary-400" />
          </button>

          {/* 드롭다운 */}
          {showDropdown && (
            <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-secondary-200 rounded-md shadow-lg min-w-[140px]">
              {COUNTRY_CODES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary-50 transition-colors ${
                    displayCountry.code === country.code ? 'bg-primary-50' : ''
                  }`}
                >
                  <span className={compact ? 'text-base' : 'text-lg'}>{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                  <span className="text-xs text-secondary-400 ml-auto">{country.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 전화번호 입력 - 포맷팅된 로컬번호 표시 */}
        <input
          type="tel"
          value={displayLocalNumber}
          onChange={handlePhoneChange}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 px-[var(--input-px)] ${compact ? 'py-1.5 sm:py-[var(--input-py)]' : 'py-[var(--input-py)]'} border-0 rounded-r-md bg-white text-secondary-900 placeholder:text-secondary-500 focus:outline-none ${
            disabled ? 'bg-secondary-100 cursor-not-allowed' : ''
          }`}
        />
      </div>
      {error && <p className="text-sm text-error-500">{error}</p>}
    </div>
  );
});
