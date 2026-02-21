import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ExistingCustomer } from '../types';

interface UseCustomerSearchProps {
  customerPhone: string;
  customers: any[] | undefined;
  onPhoneChange: (phone: string) => void;
  onNameChange: (name: string) => void;
}

interface UseCustomerSearchReturn {
  selectedCustomer: ExistingCustomer | null;
  showCustomerDropdown: boolean;
  matchingCustomers: ExistingCustomer[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleSelectCustomer: (customer: any) => void;
  handleClearCustomer: () => void;
  handlePhoneChange: (value: string) => void;
  handlePhoneFocus: () => void;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<ExistingCustomer | null>>;
  setShowCustomerDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

const toDigits = (value: string) => value.replace(/\D/g, '');

const buildSearchVariants = (phone: string): string[] => {
  const digits = toDigits(phone);
  if (!digits) return [];

  const variants = new Set<string>();

  // Raw digits
  variants.add(digits);

  // Country code stripped variants (+66, +82, +1)
  if (digits.startsWith('66') && digits.length > 2) {
    variants.add(digits.slice(2));
  } else if (digits.startsWith('82') && digits.length > 2) {
    variants.add(digits.slice(2));
  } else if (digits.startsWith('1') && digits.length > 1) {
    variants.add(digits.slice(1));
  }

  // Leading zero-agnostic variants
  Array.from(variants).forEach((v) => {
    variants.add(v.replace(/^0+/, ''));
  });

  return Array.from(variants).filter(Boolean);
};

export function useCustomerSearch({
  customerPhone,
  customers,
  onPhoneChange,
  onNameChange,
}: UseCustomerSearchProps): UseCustomerSearchReturn {
  const [selectedCustomer, setSelectedCustomer] = useState<ExistingCustomer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isPhoneInputFocused, setIsPhoneInputFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 전화번호로 고객 검색
  const matchingCustomers = useMemo(() => {
    if (!customers) return [];

    const queryVariants = buildSearchVariants(customerPhone);
    const customersWithPhone = customers.filter((customer: any) => !!customer.phone);

    // 입력 전 포커스 상태에서는 빠른 선택을 위해 상위 5명 노출
    if (queryVariants.length === 0) {
      return customersWithPhone.slice(0, 5);
    }

    return customersWithPhone
      .filter((customer: any) => {
        const customerVariants = buildSearchVariants(customer.phone);
        return queryVariants.some((query) =>
          customerVariants.some((target) => target.includes(query))
        );
      })
      .slice(0, 5);
  }, [customerPhone, customers]);

  // 포커스 + 검색 결과 존재 시 드롭다운 표시
  useEffect(() => {
    if (isPhoneInputFocused && matchingCustomers.length > 0 && !selectedCustomer) {
      setShowCustomerDropdown(true);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [isPhoneInputFocused, matchingCustomers, selectedCustomer]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
        setIsPhoneInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 기존 고객 선택
  const handleSelectCustomer = useCallback((customer: any) => {
    setSelectedCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    });
    onNameChange(customer.name);
    onPhoneChange(customer.phone);
    setShowCustomerDropdown(false);
    setIsPhoneInputFocused(false);
  }, [onNameChange, onPhoneChange]);

  // 선택 해제 (새 고객으로 전환)
  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // 전화번호 변경 핸들러
  const handlePhoneChange = useCallback(
    (value: string) => {
      onPhoneChange(value);
      if (selectedCustomer && value !== selectedCustomer.phone) {
        setSelectedCustomer(null);
      }
    },
    [selectedCustomer, onPhoneChange]
  );

  const handlePhoneFocus = useCallback(() => {
    setIsPhoneInputFocused(true);
  }, []);

  return {
    selectedCustomer,
    showCustomerDropdown,
    matchingCustomers,
    dropdownRef,
    handleSelectCustomer,
    handleClearCustomer,
    handlePhoneChange,
    handlePhoneFocus,
    setSelectedCustomer,
    setShowCustomerDropdown,
  };
}
