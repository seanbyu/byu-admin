'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salonsApi } from '../api';
import { salonKeys, SALONS_QUERY_OPTIONS, SALON_SALES_QUERY_OPTIONS } from './queries';

interface UseSalonsOptions {
  enabled?: boolean;
}

export const useSalons = (params?: Parameters<typeof salonsApi.getSalons>[0], options?: UseSalonsOptions) => {
  const queryKey = useMemo(() => salonKeys.list(params), [params]);

  const query = useQuery({
    queryKey,
    queryFn: () => salonsApi.getSalons(params),
    enabled: options?.enabled !== false,
    ...SALONS_QUERY_OPTIONS,
  });

  const salons = useMemo(() => query.data?.data || [], [query.data?.data]);

  return useMemo(
    () => ({
      data: query.data,
      salons,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, salons, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useSalon = (id: string, options?: UseSalonsOptions) => {
  const queryKey = useMemo(() => salonKeys.detail(id), [id]);

  const query = useQuery({
    queryKey,
    queryFn: () => salonsApi.getSalon(id),
    enabled: !!id && options?.enabled !== false,
    ...SALONS_QUERY_OPTIONS,
  });

  return useMemo(
    () => ({
      data: query.data,
      salon: query.data?.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useCreateSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof salonsApi.createSalon>[0]) => salonsApi.createSalon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    },
  });

  return useMemo(
    () => ({
      createSalon: mutation.mutateAsync,
      isCreating: mutation.isPending,
    }),
    [mutation.mutateAsync, mutation.isPending]
  );
};

export const useUpdateSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof salonsApi.updateSalon>[1] }) =>
      salonsApi.updateSalon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    },
  });

  return useMemo(
    () => ({
      updateSalon: mutation.mutateAsync,
      isUpdating: mutation.isPending,
    }),
    [mutation.mutateAsync, mutation.isPending]
  );
};

export const useDeleteSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => salonsApi.deleteSalon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    },
  });

  return useMemo(
    () => ({
      deleteSalon: mutation.mutateAsync,
      isDeleting: mutation.isPending,
    }),
    [mutation.mutateAsync, mutation.isPending]
  );
};

export const useApproveSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => salonsApi.approveSalon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    },
  });

  return useMemo(
    () => ({
      approveSalon: mutation.mutateAsync,
      isApproving: mutation.isPending,
    }),
    [mutation.mutateAsync, mutation.isPending]
  );
};

export const useSalonSales = (
  salonId: string,
  params: Parameters<typeof salonsApi.getSales>[1],
  options?: UseSalonsOptions
) => {
  const queryKey = useMemo(
    () => salonKeys.sales(salonId, params),
    [salonId, params]
  );

  const query = useQuery({
    queryKey,
    queryFn: () => salonsApi.getSales(salonId, params),
    enabled: !!salonId && options?.enabled !== false,
    ...SALON_SALES_QUERY_OPTIONS,
  });

  return useMemo(
    () => ({
      data: query.data,
      sales: query.data?.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};
