import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createChatApi } from '../api';

const chatApi = createChatApi();

export const useChatRooms = (params?: any, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['chat', 'rooms', params],
    queryFn: async () => {
      const response = await chatApi.getRooms(params);
      return response.data;
    },
    ...options,
  });
};

export const useChatRoom = (
  roomId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['chat', 'rooms', roomId],
    queryFn: async () => {
      const response = await chatApi.getRoom(roomId);
      return response.data;
    },
    enabled: !!roomId && options?.enabled,
  });
};

export const useChatMessages = (
  roomId: string,
  params?: any,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['chat', 'rooms', roomId, 'messages', params],
    queryFn: async () => {
      const response = await chatApi.getMessages(roomId, params);
      return response.data;
    },
    enabled: !!roomId && options?.enabled,
  });
};

export const useMarkChatRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => chatApi.markAsRead(roomId),
    onSuccess: (data, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms', roomId] });
    },
  });
};
