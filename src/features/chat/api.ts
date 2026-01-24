import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse, ChatRoom, ChatMessage, PaginationParams } from '@/types';

export const createChatApi = () => {
  return {
    getRooms: (params?: PaginationParams): Promise<ApiResponse<ChatRoom[]>> =>
      // Cast params to 'any' for now since client params type is strict record
      apiClient.get(endpoints.chat.rooms.path(), params as any),

    getRoom: (roomId: string): Promise<ApiResponse<ChatRoom>> =>
      apiClient.get(endpoints.chat.room.path(roomId)),

    getMessages: (
      roomId: string,
      params?: PaginationParams
    ): Promise<ApiResponse<ChatMessage[]>> =>
      apiClient.get(endpoints.chat.messages.path(roomId), params as any),

    markAsRead: (roomId: string) =>
      apiClient.post(endpoints.chat.markAsRead.path(roomId), {}),
  };
};
