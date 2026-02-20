import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lineSettingsApi, LineSettings } from '../api/lineSettings';

const LINE_SETTINGS_KEY = 'lineSettings';

export function useLineSettings(salonId: string) {
  const queryClient = useQueryClient();

  const query = useQuery<LineSettings | null>({
    queryKey: [LINE_SETTINGS_KEY, salonId],
    queryFn: () => lineSettingsApi.get(salonId),
    enabled: !!salonId,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const upsertMutation = useMutation({
    mutationFn: (settings: {
      lineChannelId: string;
      lineChannelSecret: string;
      lineChannelAccessToken: string;
      liffId?: string;
    }) => lineSettingsApi.upsert(salonId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LINE_SETTINGS_KEY, salonId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => lineSettingsApi.toggleActive(salonId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LINE_SETTINGS_KEY, salonId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => lineSettingsApi.delete(salonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LINE_SETTINGS_KEY, salonId] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => lineSettingsApi.verify(salonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LINE_SETTINGS_KEY, salonId] });
    },
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    isConnected: !!query.data?.lineChannelId,
    isVerified: !!query.data?.isVerified,
    isActive: !!query.data?.isActive,
    save: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
    toggle: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isRemoving: deleteMutation.isPending,
    verify: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
  };
}
