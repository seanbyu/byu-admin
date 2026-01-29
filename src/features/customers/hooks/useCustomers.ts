'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomersApi } from '../api';
import { supabase } from '@/lib/supabase/client';
import { customerKeys, CUSTOMERS_QUERY_OPTIONS } from './queries';

const customersApi = createCustomersApi(supabase);

interface UseCustomersOptions {
  enabled?: boolean;
}

export const useCustomers = (salonId: string, options?: UseCustomersOptions) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => customerKeys.list(salonId), [salonId]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await customersApi.getCustomers(salonId);
      if (!response.data) throw new Error('No data');
      return response.data;
    },
    enabled: !!salonId && options?.enabled !== false,
    ...CUSTOMERS_QUERY_OPTIONS,
  });

  const invalidateCustomers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const createMutation = useMutation({
    mutationFn: useCallback(
      (customer: any) => customersApi.createCustomer(salonId, customer),
      [salonId]
    ),
    onSuccess: invalidateCustomers,
  });

  const updateMutation = useMutation({
    mutationFn: useCallback(
      ({ id, updates }: { id: string; updates: any }) =>
        customersApi.updateCustomer(salonId, id, updates),
      [salonId]
    ),
    onSuccess: invalidateCustomers,
  });

  const deleteMutation = useMutation({
    mutationFn: useCallback(
      (id: string) => customersApi.deleteCustomer(salonId, id),
      [salonId]
    ),
    onSuccess: invalidateCustomers,
  });

  // Memoized data
  const customers = useMemo(() => query.data || [], [query.data]);

  // Memoized functions
  const createCustomer = useCallback(
    (customer: any) => createMutation.mutateAsync(customer),
    [createMutation]
  );

  const updateCustomer = useCallback(
    (params: { id: string; updates: any }) => updateMutation.mutateAsync(params),
    [updateMutation]
  );

  const deleteCustomer = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  const refetch = useCallback(() => query.refetch(), [query]);

  return useMemo(
    () => ({
      data: query.data,
      customers,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
    }),
    [
      query.data,
      customers,
      query.isLoading,
      query.isFetching,
      query.error,
      refetch,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      createMutation.isPending,
      updateMutation.isPending,
      deleteMutation.isPending,
    ]
  );
};
