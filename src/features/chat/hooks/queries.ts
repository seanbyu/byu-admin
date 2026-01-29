'use client';

// ============================================
// TanStack Query Keys & Options for Chat
// ============================================

export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  roomList: (params?: unknown) => [...chatKeys.rooms(), params] as const,
  room: (roomId: string) => [...chatKeys.rooms(), roomId] as const,
  messages: (roomId: string, params?: unknown) =>
    [...chatKeys.room(roomId), 'messages', params] as const,
};

export const CHAT_QUERY_OPTIONS = {
  staleTime: 1000 * 30, // 30초 (채팅은 실시간성 중요)
  gcTime: 1000 * 60 * 10, // 10분
  refetchOnWindowFocus: true,
  retry: 2,
} as const;

export const CHAT_MESSAGES_QUERY_OPTIONS = {
  staleTime: 1000 * 10, // 10초
  gcTime: 1000 * 60 * 5, // 5분
  refetchOnWindowFocus: true,
  retry: 2,
} as const;
