'use client';

import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { customerQueries } from '../hooks/queries';
import type { UpdateCustomerDto } from '../types';
import type {
  CustomerTab,
  CustomerFormData,
  StaffSelectItem,
} from './components/EditCustomerModal/types';
import { CustomerInfoForm } from './components/EditCustomerModal/CustomerInfoForm';
import {
  SalesTabContent,
  ServiceTabContent,
  ProductTabContent,
  ReservationTabContent,
  MembershipTabContent,
  CancellationFeeTabContent,
} from './components/EditCustomerModal/tabs';

interface CustomerDetailViewProps {
  customerNo: string;
}

const TAB_QUERY_TO_TAB: Record<string, CustomerTab> = {
  sale: 'sales',
  sales: 'sales',
  procedure: 'service',
  service: 'service',
  product: 'product',
  products: 'product',
  reservation: 'reservation',
  reserve: 'reservation',
  booking: 'reservation',
  membership: 'membership',
  cancellationfee: 'cancellationFee',
  'cancellation-fee': 'cancellationFee',
  cancellation: 'cancellationFee',
};

const TAB_TO_QUERY: Record<CustomerTab, string> = {
  sales: 'sale',
  service: 'service',
  product: 'product',
  reservation: 'reservation',
  membership: 'membership',
  cancellationFee: 'cancellationFee',
};

export default memo(function CustomerDetailView({ customerNo }: CustomerDetailViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  // 고객 목록에서 고객번호로 고객 찾기 (TanStack Query 캐시 활용)
  const { data: listData, isLoading: isLoadingList } = useQuery(
    customerQueries.list({ salon_id: salonId })
  );

  const customer = useMemo(() => {
    if (!listData?.customers) return undefined;
    return listData.customers.find((c) => c.customer_number === customerNo);
  }, [listData, customerNo]);

  const isLoadingCustomer = isLoadingList;

  const { updateCustomer, isUpdating, deleteCustomer, isDeleting } =
    useCustomers({ salon_id: salonId });

  // Staff data for select
  const { staffData, isLoading: isLoadingStaff } = useStaff(salonId);

  const eligibleStaff: StaffSelectItem[] = useMemo(() => {
    return staffData
      .filter((staff) => staff.role === 'ADMIN' || staff.role === 'ARTIST')
      .map((staff) => ({
        id: staff.id,
        name: staff.name,
        positionTitle: staff.positionTitle,
      }));
  }, [staffData]);

  // URL query 기반 탭 상태 (?tab=sale|service|product|reservation...)
  const [activeTab, setActiveTab] = useState<CustomerTab>('sales');

  // Form state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    customer_number: '',
    phone: '',
    email: '',
    notes: '',
    customer_type: 'local',
    primary_artist_id: '',
  });

  // Initialize form when customer data loads
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        customer_number: customer.customer_number || '',
        phone: customer.phone || '',
        email: customer.email || '',
        notes: customer.notes || '',
        customer_type: customer.customer_type || 'local',
        primary_artist_id: customer.primary_artist_id || customer.primary_artist?.id || '',
      });
    }
  }, [customer]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const getTabFromLocation = (): CustomerTab => {
      if (typeof window === 'undefined') return 'sales';
      const raw = (new URLSearchParams(window.location.search).get('tab') || 'sale')
        .trim()
        .toLowerCase();
      return TAB_QUERY_TO_TAB[raw] || 'sales';
    };

    // Initial tab sync from URL
    setActiveTab(getTabFromLocation());

    // Keep tab in sync when browser back/forward changes query string
    const handlePopState = () => {
      setActiveTab(getTabFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = useCallback(
    (tab: CustomerTab) => {
      if (tab === activeTab) return;
      const nextQueryTab = TAB_TO_QUERY[tab];
      setActiveTab(tab);

      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      params.set('tab', nextQueryTab);
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      // Replace URL only, without triggering app-router navigation/remount.
      window.history.replaceState(window.history.state, '', nextUrl);
    },
    [activeTab]
  );

  const handleFormDataChange = useCallback(
    (updates: Partial<CustomerFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
      const changedKeys = Object.keys(updates);
      if (changedKeys.some((key) => errors[key])) {
        setErrors((prev) => {
          const next = { ...prev };
          changedKeys.forEach((key) => delete next[key]);
          return next;
        });
      }
    },
    [errors]
  );

  const handleDelete = useCallback(async () => {
    if (!customer) return;

    try {
      await deleteCustomer(customer.id);
      setShowDeleteConfirm(false);
      router.push('/customers/chart');
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  }, [customer, deleteCustomer, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!customer) return;

      // Validation
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) {
        newErrors.name = t('customer.create.error.nameRequired');
      }
      if (formData.customer_type === 'local') {
        if (!formData.phone.trim()) {
          newErrors.phone = t('customer.create.error.phoneRequired');
        }
      }
      if (formData.phone.trim()) {
        const digits = formData.phone.replace(/\D/g, '');
        if (digits.length !== 10 && digits.length !== 11) {
          newErrors.phone = t('customer.create.error.phoneInvalid');
        }
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        const updates: UpdateCustomerDto = {
          name: formData.name,
          customer_number: formData.customer_number || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          notes: formData.notes || undefined,
          customer_type: formData.customer_type,
          primary_artist_id: formData.primary_artist_id || undefined,
        };

        await updateCustomer({
          customerId: customer.id,
          updates,
        });

        router.back();
      } catch (error) {
        console.error('Failed to update customer:', error);
      }
    },
    [customer, formData, updateCustomer, router, t]
  );

  // Loading state
  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Spinner size="xl" />
      </div>
    );
  }

  // Not found
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4">
        <div className="text-secondary-500">{t('common.noData')}</div>
        <Button variant="outline" onClick={handleBack}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  // Tab configuration
  const tabs: { key: CustomerTab; label: string }[] = [
    { key: 'sales', label: t('customer.tabs.sales') },
    { key: 'service', label: t('customer.tabs.service') },
    { key: 'product', label: t('customer.tabs.product') },
    { key: 'reservation', label: t('customer.tabs.reservation') },
    { key: 'membership', label: t('customer.tabs.membership') },
    { key: 'cancellationFee', label: t('customer.tabs.cancellationFee') },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 transition-colors md:w-10 md:h-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-secondary-900 md:text-xl">
            {t('customer.detail.title')}
          </h1>
        </div>

        {/* Content */}
        <Card padding="md" className="rounded-xl">
          <div className="flex min-h-[480px] flex-col gap-4 lg:min-h-[600px] lg:flex-row lg:gap-6">
            {/* Left Panel - Customer Info Form */}
            <div className="w-full border-secondary-200 lg:w-[360px] lg:flex-shrink-0 lg:border-r lg:pr-6">
              <CustomerInfoForm
                customer={customer}
                formData={formData}
                errors={errors}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                showDeleteConfirm={showDeleteConfirm}
                staffList={eligibleStaff}
                isLoadingStaff={isLoadingStaff}
                onFormDataChange={handleFormDataChange}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                onShowDeleteConfirm={setShowDeleteConfirm}
                onClose={handleBack}
              />
            </div>

            {/* Right Panel - Tabbed Content */}
            <div className="mt-2 w-full overflow-hidden lg:mt-0 lg:flex-1 lg:pl-6">
              {/* Tab Navigation */}
              <div className="mb-3 flex overflow-x-auto border-b border-secondary-200 lg:mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`h-10 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors md:h-11 md:px-4 md:text-base ${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[260px] overflow-auto md:min-h-[320px] lg:min-h-[500px]">
                {activeTab === 'sales' && <SalesTabContent customer={customer} />}
                {activeTab === 'service' && <ServiceTabContent />}
                {activeTab === 'product' && <ProductTabContent />}
                {activeTab === 'reservation' && <ReservationTabContent />}
                {activeTab === 'membership' && <MembershipTabContent />}
                {activeTab === 'cancellationFee' && <CancellationFeeTabContent />}
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
});
