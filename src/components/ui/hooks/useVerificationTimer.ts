'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const DEFAULT_TIMEOUT = 180; // 3분 (180초)

// 초를 MM:SS 형식으로 변환
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface UseVerificationTimerOptions {
  timeout?: number;
  onExpire?: () => void;
}

interface UseVerificationTimerReturn {
  timeLeft: number;
  isExpired: boolean;
  isRunning: boolean;
  formattedTime: string;
  startTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
}

export function useVerificationTimer(
  options: UseVerificationTimerOptions = {}
): UseVerificationTimerReturn {
  const { timeout = DEFAULT_TIMEOUT, onExpire } = options;

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  // onExpire 콜백 최신 상태 유지
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // 타이머 정리 함수
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 타이머 시작
  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(timeout);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeout, clearTimer]);

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(0);
  }, [clearTimer]);

  // 타이머 중지 (현재 시간 유지)
  const stopTimer = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timeLeft,
    isExpired: timeLeft === 0,
    isRunning: timeLeft > 0,
    formattedTime: formatTime(timeLeft),
    startTimer,
    resetTimer,
    stopTimer,
  };
}
