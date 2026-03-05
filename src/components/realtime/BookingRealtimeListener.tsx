'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { bookingKeys } from '@/features/bookings/hooks/queries';

/**
 * Supabase Realtime으로 bookings / notifications 테이블 변경 감지
 *
 * - TIMED_OUT / CHANNEL_ERROR: 지수 백오프 자동 재연결 (3s → 6s → 12s ... 최대 30s)
 * - visibilitychange: 탭 복귀 시 즉시 재연결
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

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch {
      // 오디오 재생 실패 시 무시
    }
  }, []);

  useEffect(() => {
    if (!salonId) return;

    let isMounted = true;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let channels: ReturnType<typeof supabase.channel>[] = [];

    const removeChannels = () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      channels = [];
    };

    const scheduleRetry = () => {
      if (!isMounted) return;
      const delay = Math.min(3000 * Math.pow(2, retryCount), 30_000); // 3s→6s→12s→24s→30s
      retryCount++;
      retryTimer = setTimeout(() => {
        if (isMounted) connect(); // eslint-disable-line @typescript-eslint/no-use-before-define
      }, delay);
    };

    const connect = () => {
      removeChannels();
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }

      // ── 1. bookings 채널 ────────────────────────────────────────────────
      const bookingsChannel = supabase
        .channel(`bookings:salon:${salonId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `salon_id=eq.${salonId}` },
          (payload) => {
            if (!isMounted) return;

            const t0 = performance.now();
            queryClient.refetchQueries({ queryKey: bookingKeys.list(salonId), type: 'active' });
            console.log(`[perf] realtime:bookings→refetch ${(performance.now() - t0).toFixed(1)}ms`);

            if (payload.eventType === 'INSERT') {
              const meta = (payload.new as Record<string, unknown>).booking_meta as Record<string, unknown> | null;
              if (meta) {
                const isAdmin = meta.channel === 'admin';
                if (!isAdmin) playNotificationSound();
                toastRef.current.info(
                  tRef.current(isAdmin ? 'booking.adminBookingAlert' : 'booking.newBookingAlert'),
                  5000
                );
              }
            }

            if (payload.eventType === 'UPDATE') {
              const oldData = payload.old as Record<string, unknown>;
              const newData = payload.new as Record<string, unknown>;

              if (newData.status === 'CANCELLED') {
                playNotificationSound();
                toastRef.current.info(tRef.current('booking.bookingCancelledAlert'), 5000);
              } else if (
                (oldData.booking_date !== undefined && oldData.booking_date !== newData.booking_date) ||
                (oldData.start_time  !== undefined && oldData.start_time  !== newData.start_time)
              ) {
                playNotificationSound();
                toastRef.current.info(tRef.current('booking.bookingRescheduledAlert'), 5000);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            retryCount = 0; // 성공 시 재시도 카운터 초기화
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            console.warn('[Realtime] bookings 채널 연결 실패:', status, `(재시도 ${retryCount + 1}회)`);
            scheduleRetry();
          }
        });

      // ── 2. notifications 채널 ───────────────────────────────────────────
      const notificationsChannel = supabase
        .channel(`notifications:salon:${salonId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `salon_id=eq.${salonId}` },
          () => {
            if (!isMounted) return;
            const t0 = performance.now();
            queryClient.refetchQueries({ queryKey: ['notifications', salonId], type: 'active' });
            queryClient.refetchQueries({ queryKey: ['notifications', 'unread-count', salonId], type: 'active' });
            console.log(`[perf] realtime:notifications→refetch ${(performance.now() - t0).toFixed(1)}ms`);
          }
        )
        .subscribe((status) => {
          if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            console.warn('[Realtime] notifications 채널 연결 실패:', status, `(재시도 ${retryCount + 1}회)`);
            // bookings 채널의 scheduleRetry가 두 채널을 함께 재연결
          }
        });

      channels = [bookingsChannel, notificationsChannel];
    };

    // 최초 연결
    connect();

    // 탭 복귀 시 재연결
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        retryCount = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      removeChannels();
    };
  }, [salonId, queryClient, playNotificationSound]);

  return null;
}
