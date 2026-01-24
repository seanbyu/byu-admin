import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffApi } from '../api';
import { supabase } from '@/lib/supabase/client';

const staffApi = createStaffApi(supabase);
import { Staff } from '../types';

export const useStaff = (salonId: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ['staff', salonId],
    queryFn: () => staffApi.getStaffList(salonId),
    enabled: !!salonId && options?.enabled,
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({
      staffId,
      updates,
    }: {
      staffId: string;
      updates: Partial<Staff>;
    }) => staffApi.updateStaff(salonId, staffId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', salonId] });
    },
  });

  return {
    ...staffQuery,
    updateStaff: updateStaffMutation.mutateAsync,
    isUpdating: updateStaffMutation.isPending,
  };
};
