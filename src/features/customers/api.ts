import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse, Customer } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export const createCustomersApi = (client?: SupabaseClient<any>) => {
  return {
    getCustomers: (salonId: string): Promise<ApiResponse<Customer[]>> =>
      apiClient.get(endpoints.salons.customers.path(salonId)),

    getCustomer: (
      salonId: string,
      id: string
    ): Promise<ApiResponse<Customer>> =>
      apiClient.get(endpoints.salons.customers.path(salonId), { id }),

    createCustomer: (
      salonId: string,
      customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits'>
    ) =>
      apiClient.post(endpoints.salons.customers.path(salonId), {
        action: 'create_customer',
        ...customer,
      }),

    updateCustomer: (salonId: string, id: string, updates: Partial<Customer>) =>
      apiClient.post(endpoints.salons.customers.path(salonId), {
        action: 'update_customer',
        id,
        updates,
      }),

    deleteCustomer: (salonId: string, id: string) =>
      apiClient.post(endpoints.salons.customers.path(salonId), {
        action: 'delete_customer',
        id,
      }),
  };
};
