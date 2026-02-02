'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// 국가 코드 데이터
const COUNTRY_CODES = [
  { code: '+82', country: 'KR', flag: '🇰🇷', name: '한국' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'ไทย' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA' },
] as const;

type CountryCode = typeof COUNTRY_CODES[number];

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
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 국가 선택 핸들러
  const handleCountrySelect = useCallback((country: CountryCode) => {
    setSelectedCountry(country);
    setShowDropdown(false);
  }, []);

  // 전화번호 입력 핸들러 (저장은 기존 방식 유지 - 국가코드 없이)
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

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
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm text-secondary-600">{selectedCountry.code}</span>
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
                    selectedCountry.code === country.code ? 'bg-primary-50' : ''
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

        {/* 전화번호 입력 */}
        <input
          type="tel"
          value={value}
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
