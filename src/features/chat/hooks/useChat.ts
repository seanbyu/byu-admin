'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createChatApi } from '../api';
import { PaginationParams } from '@/types';
import {
  chatKeys,
  CHAT_QUERY_OPTIONS,
  CHAT_MESSAGES_QUERY_OPTIONS,
} from './queries';

const chatApi = createChatApi();

export const useChatRooms = (params?: PaginationParams, options?: { enabled?: boolean }) => {
  const queryKey = useMemo(() => chatKeys.roomList(params), [params]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await chatApi.getRooms(params);
      return response.data;
    },
    enabled: options?.enabled !== false,
    ...CHAT_QUERY_OPTIONS,
  });

  const rooms = useMemo(() => query.data || [], [query.data]);

  return useMemo(
    () => ({
      data: query.data,
      rooms,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, rooms, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useChatRoom = (roomId: string, options?: { enabled?: boolean }) => {
  const queryKey = useMemo(() => chatKeys.room(roomId), [roomId]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await chatApi.getRoom(roomId);
      return response.data;
    },
    enabled: !!roomId && options?.enabled !== false,
    ...CHAT_QUERY_OPTIONS,
  });

  return useMemo(
    () => ({
      data: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useChatMessages = (
  roomId: string,
  params?: PaginationParams,
  options?: { enabled?: boolean }
) => {
  const queryKey = useMemo(
    () => chatKeys.messages(roomId, params),
    [roomId, params]
  );

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await chatApi.getMessages(roomId, params);
      return response.data;
    },
    enabled: !!roomId && options?.enabled !== false,
    ...CHAT_MESSAGES_QUERY_OPTIONS,
  });

  const messages = useMemo(() => query.data || [], [query.data]);

  return useMemo(
    () => ({
      data: query.data,
      messages,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, messages, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useMarkChatRead = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (roomId: string) => chatApi.markAsRead(roomId),
    onSuccess: (_data: unknown, roomId: string) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.room(roomId) });
    },
  });

  return useMemo(
    () => ({
      markAsRead: mutation.mutateAsync,
      isMarking: mutation.isPending,
    }),
    [mutation.mutateAsync, mutation.isPending]
  );
};
