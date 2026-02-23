'use client';

import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '../../../hooks/useCustomers';
import { useStaff } from '@/features/staff/hooks/useStaff';
import type { UpdateCustomerDto } from '../../../types';
import type {
  EditCustomerModalProps,
  CustomerTab,
  CustomerFormData,
  StaffSelectItem,
} from './types';
import { CustomerInfoForm } from './CustomerInfoForm';
import {
  SalesTabContent,
  ServiceTabContent,
  ProductTabContent,
  ReservationTabContent,
  MembershipTabContent,
  CancellationFeeTabContent,
} from './tabs';

export const EditCustomerModal = memo(function EditCustomerModal({
  isOpen,
  customer,
  onClose,
}: EditCustomerModalProps) {
  const t = useTranslations();
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';

  const { updateCustomer, isUpdating, deleteCustomer, isDeleting } =
    useCustomers({ salon_id: salonId });

  // Staff data for select
  const { staffData, isLoading: isLoadingStaff } = useStaff(salonId);

  // Filter staff to only ADMIN and ARTIST roles
  const eligibleStaff: StaffSelectItem[] = useMemo(() => {
    return staffData
      .filter((staff) => staff.role === 'ADMIN' || staff.role === 'ARTIST')
      .map((staff) => ({
        id: staff.id,
        name: staff.name,
        positionTitle: staff.positionTitle,
      }));
  }, [staffData]);

  // Tab state
  const [activeTab, setActiveTab] = useState<CustomerTab>('sales');

  // Form state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    customer_number: '',
    phone: '',
    email: '',
    notes: '',
    customer_type: 'local',
    primary_artist_id: '',
  });

  // Initialize form when customer changes
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
      setShowDeleteConfirm(false);
      setActiveTab('sales');
    }
  }, [customer]);

  const handleFormDataChange = useCallback(
    (updates: Partial<CustomerFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleDelete = useCallback(async () => {
    if (!customer) return;

    try {
      await deleteCustomer(customer.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  }, [customer, deleteCustomer, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!customer) return;

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

        onClose();
      } catch (error) {
        console.error('Failed to update customer:', error);
      }
    },
    [customer, formData, updateCustomer, onClose]
  );

  if (!customer) return null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.edit.title')}
      size="full"
    >
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Panel - Customer Info Form */}
        <div className="w-full lg:w-[380px] lg:flex-shrink-0 lg:pr-6 lg:border-r border-secondary-200">
          <CustomerInfoForm
            customer={customer}
            formData={formData}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            showDeleteConfirm={showDeleteConfirm}
            staffList={eligibleStaff}
            isLoadingStaff={isLoadingStaff}
            onFormDataChange={handleFormDataChange}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            onShowDeleteConfirm={setShowDeleteConfirm}
            onClose={onClose}
          />
        </div>

        {/* Right Panel - Tabbed Content */}
        <div className="w-full mt-6 lg:mt-0 lg:flex-1 lg:pl-6 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-secondary-200 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-11 px-4 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap ${
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
          <div className="min-h-[360px] lg:min-h-[500px] overflow-auto">
            {activeTab === 'sales' && <SalesTabContent customer={customer} />}
            {activeTab === 'service' && <ServiceTabContent />}
            {activeTab === 'product' && <ProductTabContent />}
            {activeTab === 'reservation' && <ReservationTabContent />}
            {activeTab === 'membership' && <MembershipTabContent />}
            {activeTab === 'cancellationFee' && <CancellationFeeTabContent />}
          </div>
        </div>
      </div>
    </Modal>
  );
});
