import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCustomersApi } from '../api';
import { supabase } from '@/lib/supabase/client';

const customersApi = createCustomersApi(supabase);

export const useCustomers = (
  salonId: string,
  options?: { enabled?: boolean }
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['customers', salonId],
    queryFn: async () => {
      const response = await customersApi.getCustomers(salonId);
      if (!response.data) throw new Error('No data');
      return response.data;
    },
    enabled: !!salonId && options?.enabled,
  });

  const createMutation = useMutation({
    mutationFn: (customer: any) =>
      customersApi.createCustomer(salonId, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', salonId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      customersApi.updateCustomer(salonId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', salonId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(salonId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', salonId] });
    },
  });

  return {
    ...query,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
  };
};
