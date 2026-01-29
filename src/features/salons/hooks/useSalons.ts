'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salonsApi } from '../api';
import { ApiResponse } from '@/types';
import { salonKeys, SALONS_QUERY_OPTIONS, SALON_SALES_QUERY_OPTIONS } from './queries';

interface UseSalonsOptions {
  enabled?: boolean;
}

export const useSalons = (params?: any, options?: UseSalonsOptions) => {
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
    mutationFn: useCallback((data: any) => salonsApi.createSalon(data), []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    }, [queryClient]),
  });

  const createSalon = useCallback(
    (data: any) => mutation.mutateAsync(data),
    [mutation]
  );

  return useMemo(
    () => ({
      createSalon,
      isCreating: mutation.isPending,
    }),
    [createSalon, mutation.isPending]
  );
};

export const useUpdateSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: useCallback(
      ({ id, data }: { id: string; data: any }) => salonsApi.updateSalon(id, data),
      []
    ),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    }, [queryClient]),
  });

  const updateSalon = useCallback(
    (params: { id: string; data: any }) => mutation.mutateAsync(params),
    [mutation]
  );

  return useMemo(
    () => ({
      updateSalon,
      isUpdating: mutation.isPending,
    }),
    [updateSalon, mutation.isPending]
  );
};

export const useDeleteSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: useCallback((id: string) => salonsApi.deleteSalon(id), []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    }, [queryClient]),
  });

  const deleteSalon = useCallback(
    (id: string) => mutation.mutateAsync(id),
    [mutation]
  );

  return useMemo(
    () => ({
      deleteSalon,
      isDeleting: mutation.isPending,
    }),
    [deleteSalon, mutation.isPending]
  );
};

export const useApproveSalon = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: useCallback((id: string) => salonsApi.approveSalon(id), []),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: salonKeys.all });
    }, [queryClient]),
  });

  const approveSalon = useCallback(
    (id: string) => mutation.mutateAsync(id),
    [mutation]
  );

  return useMemo(
    () => ({
      approveSalon,
      isApproving: mutation.isPending,
    }),
    [approveSalon, mutation.isPending]
  );
};

export const useSalonSales = (
  salonId: string,
  params: any,
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
