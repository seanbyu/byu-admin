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

// 전화번호에서 국가코드와 로컬번호를 분리하는 함수
const parsePhoneNumber = (phone: string): { countryCode: CountryCode; localNumber: string } => {
  if (!phone) {
    return { countryCode: COUNTRY_CODES[0], localNumber: '' };
  }

  // 국가코드 순서대로 매칭 시도 (긴 코드부터 체크)
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

  for (const country of sortedCodes) {
    if (phone.startsWith(country.code)) {
      // 국가코드 뒤의 구분자(-, 공백) 제거 후 로컬번호 추출
      const localNumber = phone.slice(country.code.length).replace(/^[-\s]/, '');
      return { countryCode: country, localNumber };
    }
  }

  // 국가코드가 없으면 기본값(한국)과 전체 번호 반환
  return { countryCode: COUNTRY_CODES[0], localNumber: phone };
};

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export const PhoneInput = memo(function PhoneInput({
  value,
  onChange,
  label,
  placeholder = '010-0000-0000',
  error,
}: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 전화번호 파싱 (국가코드 + 로컬번호 분리)
  const { countryCode: parsedCountry, localNumber } = useMemo(
    () => parsePhoneNumber(value),
    [value]
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

  // 국가 선택 핸들러 - 국가코드 변경 시 전체 값 업데이트
  const handleCountrySelect = useCallback((country: CountryCode) => {
    setShowDropdown(false);
    setSelectedCountryCode(country);
    // 로컬번호가 있으면 새 국가코드와 조합하여 저장
    if (localNumber) {
      onChange(`${country.code}-${localNumber}`);
    }
  }, [localNumber, onChange]);

  // 전화번호 입력 핸들러 - 선택된 국가코드 포함하여 저장
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자와 하이픈만 허용
    const rawValue = e.target.value.replace(/[^0-9-]/g, '');
    // 숫자만 추출하여 길이 체크 (최대 11자리)
    const digitsOnly = rawValue.replace(/-/g, '');
    if (digitsOnly.length > 11) {
      return; // 11자리 초과 시 입력 무시
    }

    if (rawValue) {
      // value가 있으면 기존 국가코드 유지, 없으면 선택된 국가코드 사용
      const countryCode = value ? parsedCountry.code : selectedCountryCode.code;
      onChange(`${countryCode}-${rawValue}`);
    } else {
      onChange('');
    }
  }, [value, parsedCountry.code, selectedCountryCode.code, onChange]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div className="flex">
        {/* 국가 코드 선택기 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 px-3 py-2 border border-r-0 border-secondary-300 rounded-l-md bg-secondary-50 hover:bg-secondary-100 transition-colors min-w-[90px]"
          >
            <span className="text-lg">{displayCountry.flag}</span>
            <span className="text-sm text-secondary-600">{displayCountry.code}</span>
            <ChevronDown size={14} className="text-secondary-400" />
          </button>

          {/* 드롭다운 */}
          {showDropdown && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-secondary-200 rounded-md shadow-lg min-w-[140px]">
              {COUNTRY_CODES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary-50 transition-colors ${
                    displayCountry.code === country.code ? 'bg-primary-50' : ''
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                  <span className="text-xs text-secondary-400 ml-auto">{country.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 전화번호 입력 - 로컬번호만 표시 */}
        <input
          type="tel"
          value={localNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 border border-secondary-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            error ? 'border-red-500' : ''
          }`}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});
