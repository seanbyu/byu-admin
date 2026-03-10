import { cn } from '@/lib/utils';
import { Card } from './Card';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-secondary-200', className)}
    />
  );
}

// ─────────────────────────────────────────────
// 온라인 예약 설정 페이지
// ─────────────────────────────────────────────

/** 아코디언 카드 1개 스켈레톤 (아이콘 + 제목 + 셰브론) */
export function AccordionCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="w-[18px] h-[18px] rounded-full shrink-0" />
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-4 ml-1" />
      </div>
    </Card>
  );
}

/** 영업 설정 + 휴무일 설정 2열 카드 스켈레톤 */
export function ShopSettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
      <Card className="p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// 예약차트 페이지
// ─────────────────────────────────────────────

/** 예약차트 전체 페이지 스켈레톤 (날짜 네비 + 필터 + 스태프 컬럼 테이블) */
export function BookingsChartSkeleton() {
  return (
    <div className="space-y-4">
      {/* 날짜 네비 + 필터 컨트롤 */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-9 rounded" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-9 rounded" />
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* 스태프 컬럼 테이블 */}
      <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="flex border-b border-secondary-200 p-2 gap-2">
          <Skeleton className="h-8 w-14 shrink-0" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex border-b border-secondary-100 p-1 gap-2">
            <Skeleton className="h-7 w-14 shrink-0 opacity-60" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn('h-7 flex-1', i % 4 === 1 ? 'opacity-40' : 'opacity-20')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메뉴관리 페이지
// ─────────────────────────────────────────────

/** 메뉴관리 컨텐츠 스켈레톤 (카테고리 사이드바 + 메뉴 아이템) */
export function MenuContentSkeleton() {
  return (
    <div className="flex h-[460px] md:h-[520px] xl:h-[600px]">
      {/* 카테고리 사이드바 */}
      <div className="w-48 md:w-56 border-r border-secondary-200 p-3 space-y-1 shrink-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-9 w-full', i !== 0 && 'opacity-60')} />
        ))}
      </div>
      {/* 메뉴 아이템 목록 */}
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        <Skeleton className="h-5 w-24 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 제품관리 페이지
// ─────────────────────────────────────────────

/** 제품 목록 컨텐츠 스켈레톤 (카테고리별 제품 그룹) */
export function ProductListContentSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 매출관리 페이지
// ─────────────────────────────────────────────

/** 매출관리 페이지 스켈레톤 (요약카드 + 통계그리드 + 테이블) */
export function SalesPageSkeleton() {
  return (
    <div className="space-y-5">
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      {/* 통계 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </Card>
        <Card className="p-4 space-y-3 lg:col-span-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </Card>
      </div>

      {/* 메뉴별 매출 */}
      <Card className="p-4 space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </Card>

      {/* 테이블 */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-secondary-200 bg-secondary-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-secondary-100">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-14 ml-auto" />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// 설정 페이지 탭 공통 스켈레톤
// ─────────────────────────────────────────────

/** 설정 탭 스켈레톤 (이미지 섹션 + 폼 필드 카드) */
export function SettingsTabSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 이미지 섹션 */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </Card>

      {/* 기본 정보 카드 */}
      <Card className="p-4 sm:p-6 space-y-5">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </Card>

      {/* SNS 카드 */}
      <Card className="p-4 sm:p-6 space-y-5">
        <Skeleton className="h-5 w-20" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// 대시보드 페이지
// ─────────────────────────────────────────────

/** 대시보드 페이지 스켈레톤 (통계카드 + 예약현황 + 최근활동) */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      {/* 예약 현황 3개 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 최근 활동 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="h-4 w-10 ml-auto" />
                  <Skeleton className="h-3 w-8 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 직원관리 / 고객차트 페이지 (공통 테이블 레이아웃)
// ─────────────────────────────────────────────

/** 테이블 페이지 스켈레톤 (헤더 버튼 + 테이블 행) — 직원관리, 고객차트 공용 */
export function TablePageSkeleton() {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-secondary-200 bg-secondary-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-secondary-100"
          >
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
