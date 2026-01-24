import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salonsApi } from '../api';
import { endpoints } from '@/lib/api/endpoints';
import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ApiResponse } from '@/types';

export const useSalons = (params?: any, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: endpoints.salons.all.queryKey(params),
    queryFn: () => salonsApi.getSalons(params),
    ...options,
  });
};

export const useSalon = (id: string, options?: UseQueryOptions) => {
  return useQuery({
    queryKey: endpoints.salons.detail.queryKey(id),
    queryFn: () => salonsApi.getSalon(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateSalon = (
  options?: Omit<UseMutationOptions<ApiResponse<any>, Error, any>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => salonsApi.createSalon(data),
    onSuccess: () => {
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: endpoints.salons.all.queryKey(),
      });
      // Note: endpoints.salons.all.queryKey() might return ['salons', undefined]
      // To be safe, we might want to invalidate strictly ['salons'] but React Query matching is loose by default?
      // Actually, queryKeys.salons ('salons') was used before.
      // Endpoints structure returns a tuple.
      // If we used a factory like `queryKeys.salons` it would be just `['salons']`.
      // Let's use validation:
      queryClient.invalidateQueries({
        queryKey: ['salons'], // Base key
      });
    },
    ...options,
  });
};

export const useUpdateSalon = (
  options?: Omit<
    UseMutationOptions<ApiResponse<any>, Error, { id: string; data: any }>,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      salonsApi.updateSalon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
    },
    ...options,
  });
};

export const useDeleteSalon = (
  options?: Omit<
    UseMutationOptions<ApiResponse<any>, Error, string>,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salonsApi.deleteSalon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
    },
    ...options,
  });
};

export const useApproveSalon = (
  options?: Omit<
    UseMutationOptions<ApiResponse<any>, Error, string>,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salonsApi.approveSalon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] });
    },
    ...options,
  });
};

export const useSalonSales = (
  salonId: string,
  params: any,
  options?: UseQueryOptions
) => {
  return useQuery({
    queryKey: endpoints.salons.sales.queryKey(salonId, params),
    queryFn: () => salonsApi.getSales(salonId, params),
    enabled: !!salonId,
    ...options,
  });
};
