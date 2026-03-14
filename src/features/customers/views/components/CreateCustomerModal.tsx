'use client';

import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { ModalActions } from '@/components/ui/ModalActions';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '../../hooks/useCustomers';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { customerApi } from '../../api';
import type { CreateCustomerDto, CustomerType } from '../../types';

// ============================================
// CreateCustomerModal Component
// ============================================

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 년도 옵션 생성 (현재년도 ~ 100년 전)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear; i >= currentYear - 100; i--) {
    years.push(i);
  }
  return years;
};

// 월 옵션 생성 (1-12)
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// 일 옵션 생성 (1-31)
const generateDayOptions = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

export const CreateCustomerModal = memo(function CreateCustomerModal({
  isOpen,
  onClose,
}: CreateCustomerModalProps) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const queryClient = useQueryClient();
  const { createCustomer, isCreating } = useCustomers({ salon_id: salonId });
  const { staffData, isLoading: isLoadingStaff } = useStaff(salonId);

  // 다음 고객번호 자동 생성 (useQuery로 조회)
  const { data: nextNumberData, isLoading: isLoadingNextNumber } = useQuery({
    queryKey: ['nextCustomerNumber', salonId],
    queryFn: () => customerApi.getNextCustomerNumber(salonId),
    enabled: isOpen && !!salonId,
    staleTime: 0,  // 즉시 stale 처리
    gcTime: 0,     // 모달 닫힐 때 캐시 즉시 제거 → 재오픈 시 항상 서버에서 새 번호 조회
  });

  // 담당자 필터링 (ADMIN, ARTIST만)
  const eligibleStaff = useMemo(() => {
    return staffData.filter(
      (staff) => staff.role === 'ADMIN' || staff.role === 'ARTIST'
    );
  }, [staffData]);

  // 년도 옵션
  const yearOptions = useMemo(() => generateYearOptions(), []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    primary_artist_id: '',
    customer_number: '',
    customer_type: 'local' as CustomerType,
    birth_year: '',
    birth_month: '',
    birth_day: '',
    occupation: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 선택된 년/월에 따른 일 옵션
  const dayOptions = useMemo(() => {
    if (formData.birth_year && formData.birth_month) {
      return generateDayOptions(
        parseInt(formData.birth_year),
        parseInt(formData.birth_month)
      );
    }
    return Array.from({ length: 31 }, (_, i) => i + 1);
  }, [formData.birth_year, formData.birth_month]);

  // 다음 고객번호가 조회되면 formData에 설정
  useEffect(() => {
    const nextNumber = nextNumberData?.data?.nextNumber;
    if (nextNumber && !formData.customer_number) {
      setFormData((prev) => ({
        ...prev,
        customer_number: nextNumber,
      }));
    }
  }, [nextNumberData, formData.customer_number]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        phone: '',
        primary_artist_id: '',
        customer_number: '',
        customer_type: 'local' as CustomerType,
        birth_year: '',
        birth_month: '',
        birth_day: '',
        occupation: '',
        notes: '',
      });
      setErrors({});
      // 캐시 제거하여 다음 열림 시 새 고객번호 조회
      queryClient.removeQueries({ queryKey: ['nextCustomerNumber', salonId] });
    }
  }, [isOpen, queryClient, salonId]);

  const handleChange = useCallback(
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.value;

        // 고객번호는 숫자만 허용
        if (field === 'customer_number') {
          if (value && !/^\d*$/.test(value)) return;
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
        // 에러 클리어
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: '' }));
        }
      },
    [errors]
  );

  const handlePhoneChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, phone: value }));
      if (errors.phone) {
        setErrors((prev) => ({ ...prev, phone: '' }));
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('customer.create.error.nameRequired');
    }
    if (formData.customer_type !== 'foreign' && !formData.phone.trim()) {
      newErrors.phone = t('customer.create.error.phoneRequired');
    }
    if (formData.phone.trim()) {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 11) {
        newErrors.phone = t('customer.create.error.phoneInvalid');
      }
    }
    if (!formData.customer_number.trim()) {
      newErrors.customer_number = t('customer.create.error.customerNumberRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      try {
        // 생년월일 조합
        let birth_date: string | undefined;
        if (formData.birth_year && formData.birth_month && formData.birth_day) {
          birth_date = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
        }

        const dto: CreateCustomerDto = {
          salon_id: salonId,
          name: formData.name,
          phone: formData.phone || undefined,
          primary_artist_id: formData.primary_artist_id || undefined,
          customer_number: formData.customer_number || undefined,
          customer_type: formData.customer_type,
          birth_date,
          occupation: formData.occupation || undefined,
          notes: formData.notes || undefined,
        };

        await createCustomer(dto);
        // 고객 생성 후 다음 번호 캐시 무효화 → 다음 모달 오픈 시 정확한 번호 표시
        queryClient.invalidateQueries({ queryKey: ['nextCustomerNumber', salonId] });
        onClose();
      } catch (error) {
        console.error('Failed to create customer:', error);
      }
    },
    [formData, salonId, validateForm, createCustomer, onClose]
  );

  // 초기 데이터 로딩 상태
  const isInitialLoading = isLoadingStaff || isLoadingNextNumber;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.create.title')}
      footer={
        !isInitialLoading ? (
          <ModalActions onCancel={onClose} formId="create-customer-form" isSaving={isCreating} />
        ) : undefined
      }
    >
      {isInitialLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
      <form id="create-customer-form" onSubmit={handleSubmit} className="space-y-4">
        {/* 고객 이름 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.name')} <span className="text-error-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={handleChange('name')}
            placeholder={t('customer.create.namePlaceholder')}
            error={errors.name}
          />
        </div>

        {/* 고객 유형 (내국인/외국인) */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.customerType')}
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, customer_type: 'local' as CustomerType }))}
              className={`flex-1 h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                formData.customer_type === 'local'
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              {t('customer.type.local')}
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, customer_type: 'foreign' as CustomerType }))}
              className={`flex-1 h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                formData.customer_type === 'foreign'
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50'
              }`}
            >
              {t('customer.type.foreign')}
            </button>
          </div>
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.phone')} {formData.customer_type !== 'foreign' && <span className="text-error-500">*</span>}
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="08X-XXX-XXXX"
            defaultCountryCode="+66"
            error={errors.phone}
          />
        </div>

        {/* 담당자 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.primaryArtist')}
          </label>
          <Select
            value={formData.primary_artist_id}
            onChange={handleChange('primary_artist_id')}
            placeholder={t('customer.create.unassigned')}
            options={eligibleStaff.map((staff) => ({
              value: staff.id,
              label: `${staff.name}${staff.positionTitle ? ` (${staff.positionTitle})` : ''}`,
            }))}
            disabled={isLoadingStaff}
          />
        </div>

        {/* 고객번호 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.customerNumber')} <span className="text-error-500">*</span>
          </label>
          <Input
            value={formData.customer_number}
            onChange={handleChange('customer_number')}
            placeholder={t('customer.create.customerNumberPlaceholder')}
            error={errors.customer_number}
          />
          <p className="text-xs text-secondary-500 mt-1">
            {t('customer.create.customerNumberHint')}
          </p>
        </div>

        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.birthDate')}
          </label>
          <div className="flex gap-2">
            {/* 년 */}
            <div className="flex-1">
              <Select
                value={formData.birth_year}
                onChange={handleChange('birth_year')}
                placeholder={t('customer.create.year')}
                options={yearOptions.map((year) => ({
                  value: String(year),
                  label: String(year),
                }))}
              />
            </div>

            {/* 월 */}
            <div className="flex-1">
              <Select
                value={formData.birth_month}
                onChange={handleChange('birth_month')}
                placeholder={t('customer.create.month')}
                options={MONTH_OPTIONS.map((month) => ({
                  value: String(month),
                  label: String(month),
                }))}
              />
            </div>

            {/* 일 */}
            <div className="flex-1">
              <Select
                value={formData.birth_day}
                onChange={handleChange('birth_day')}
                placeholder={t('customer.create.day')}
                options={dayOptions.map((day) => ({
                  value: String(day),
                  label: String(day),
                }))}
              />
            </div>
          </div>
        </div>

        {/* 직업 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.occupation')}
          </label>
          <Input
            value={formData.occupation}
            onChange={handleChange('occupation')}
            placeholder={t('customer.create.occupationPlaceholder')}
          />
        </div>

        {/* 고객메모 */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.field.notes')}
          </label>
          <Textarea
            value={formData.notes}
            onChange={handleChange('notes')}
            placeholder={t('customer.edit.notesPlaceholder')}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

      </form>
      )}
    </Modal>
  );
});
