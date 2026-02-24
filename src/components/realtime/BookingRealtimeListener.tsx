'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { bookingKeys } from '@/features/bookings/hooks/queries';

/**
 * Supabase Realtime으로 bookings 테이블 변경 감지
 * - INSERT: 새 예약 알림 (토스트 + 사운드)
 * - UPDATE/DELETE: 쿼리 무효화 (자동 갱신)
 */
export function BookingRealtimeListener() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const toast = useToast();
  const t = useTranslations();
  const salonId = user?.salonId;

  // ref로 최신 함수를 유지 (구독 재생성 방지)
  const toastRef = useRef(toast);
  const tRef = useRef(t);
  toastRef.current = toast;
  tRef.current = t;

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 알림음: 짧은 2음 차임
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.15); // D6
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch {
      // 오디오 재생 실패 시 무시 (사용자 인터랙션 전 차단될 수 있음)
    }
  }, []);

  useEffect(() => {
    if (!salonId) return;

    // 1. bookings 테이블 구독 → 예약 목록 갱신 + 새 예약 알림
    const bookingsChannel = supabase
      .channel(`bookings:salon:${salonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: bookingKeys.list(salonId) });

          if (payload.eventType === 'INSERT') {
            const newBooking = payload.new as Record<string, unknown>;
            const meta = newBooking.booking_meta as Record<string, unknown> | null;

            if (meta) {
              playNotificationSound();
              toastRef.current.info(
                tRef.current('booking.newBookingAlert'),
                5000
              );
            }
          }

          if (payload.eventType === 'UPDATE') {
            const oldData = payload.old as Record<string, unknown>;
            const newData = payload.new as Record<string, unknown>;

            if (oldData.booking_date !== newData.booking_date || oldData.start_time !== newData.start_time) {
              playNotificationSound();
              toastRef.current.info(
                tRef.current('booking.bookingRescheduledAlert'),
                5000
              );
            }
          }
        }
      )
      .subscribe();

    // 2. notifications 테이블 구독 → 사이드바 알림 패널 즉시 갱신
    const notificationsChannel = supabase
      .channel(`notifications:salon:${salonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', salonId] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', salonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [salonId, queryClient, playNotificationSound]);

  return null;
}
