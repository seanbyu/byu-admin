import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ExistingCustomer } from '../types';

interface UseCustomerSearchProps {
  customerPhone: string;
  customers: any[] | undefined;
  onPhoneChange: (phone: string) => void;
}

interface UseCustomerSearchReturn {
  selectedCustomer: ExistingCustomer | null;
  showCustomerDropdown: boolean;
  matchingCustomers: ExistingCustomer[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleSelectCustomer: (customer: any) => void;
  handleClearCustomer: () => void;
  handlePhoneChange: (value: string) => void;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<ExistingCustomer | null>>;
  setShowCustomerDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCustomerSearch({
  customerPhone,
  customers,
  onPhoneChange,
}: UseCustomerSearchProps): UseCustomerSearchReturn {
  const [selectedCustomer, setSelectedCustomer] = useState<ExistingCustomer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 전화번호로 고객 검색
  const matchingCustomers = useMemo(() => {
    if (!customerPhone || customerPhone.length < 4 || !customers) return [];

    const phoneDigits = customerPhone.replace(/[^0-9]/g, '');

    return customers
      .filter((customer: any) => {
        if (!customer.phone) return false;
        const customerDigits = customer.phone.replace(/[^0-9]/g, '');
        return customerDigits.includes(phoneDigits);
      })
      .slice(0, 5);
  }, [customerPhone, customers]);

  // 전화번호 변경 시 드롭다운 표시
  useEffect(() => {
    if (matchingCustomers.length > 0 && !selectedCustomer) {
      setShowCustomerDropdown(true);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [matchingCustomers, selectedCustomer]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
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
    onPhoneChange(customer.phone);
    setShowCustomerDropdown(false);
  }, [onPhoneChange]);

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

  return {
    selectedCustomer,
    showCustomerDropdown,
    matchingCustomers,
    dropdownRef,
    handleSelectCustomer,
    handleClearCustomer,
    handlePhoneChange,
    setSelectedCustomer,
    setShowCustomerDropdown,
  };
}
