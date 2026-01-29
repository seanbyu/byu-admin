'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffApi } from '../api';
import { supabase } from '@/lib/supabase/client';
import { Staff } from '../types';
import { staffKeys, STAFF_QUERY_OPTIONS } from './queries';

const staffApi = createStaffApi(supabase);

interface UseStaffOptions {
  enabled?: boolean;
}

export const useStaff = (salonId: string, options?: UseStaffOptions) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => staffKeys.list(salonId), [salonId]);

  const staffQuery = useQuery({
    queryKey,
    queryFn: () => staffApi.getStaffList(salonId),
    enabled: !!salonId && options?.enabled !== false,
    ...STAFF_QUERY_OPTIONS,
  });

  const updateStaffMutation = useMutation({
    mutationFn: useCallback(
      ({ staffId, updates }: { staffId: string; updates: Partial<Staff> }) =>
        staffApi.updateStaff(salonId, staffId, updates),
      [salonId]
    ),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey });
    }, [queryClient, queryKey]),
  });

  // Memoized return values
  const staffData = useMemo(() => staffQuery.data?.data || [], [staffQuery.data?.data]);

  const updateStaff = useCallback(
    (params: { staffId: string; updates: Partial<Staff> }) =>
      updateStaffMutation.mutateAsync(params),
    [updateStaffMutation]
  );

  const refetch = useCallback(() => staffQuery.refetch(), [staffQuery]);

  return useMemo(
    () => ({
      data: staffQuery.data,
      staffData,
      isLoading: staffQuery.isLoading,
      isFetching: staffQuery.isFetching,
      error: staffQuery.error,
      refetch,
      updateStaff,
      isUpdating: updateStaffMutation.isPending,
    }),
    [
      staffQuery.data,
      staffData,
      staffQuery.isLoading,
      staffQuery.isFetching,
      staffQuery.error,
      refetch,
      updateStaff,
      updateStaffMutation.isPending,
    ]
  );
};
