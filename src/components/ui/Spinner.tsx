import React from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  /** 스피너 크기 */
  size?: SpinnerSize;
  /** 추가 클래스 */
  className?: string;
  /** 스피너 색상 (기본: currentColor) */
  color?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

/**
 * 로딩 스피너 컴포넌트
 * 버튼, 페이지 로딩 등에서 재사용 가능
 *
 * @example
 * // 버튼 내 사용
 * <Button>{isLoading ? <Spinner size="sm" /> : '저장'}</Button>
 *
 * // 페이지 로딩
 * <div className="flex justify-center"><Spinner size="lg" /></div>
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  color,
}) => {
  return (
    <svg
      className={cn('animate-spin', sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={color ? { color } : undefined}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
