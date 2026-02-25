'use client';

import { memo, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, ArrowUpDown, Plus, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type {
  CustomerFilterType,
  CustomerSortBy,
  CustomerBaseFilterType,
} from '../../types';
import type { CustomFilter, FilterCondition, CustomerFilterField, FilterOperator } from '../../types/filter.types';
import { FILTER_FIELD_META, OPERATOR_LABELS } from '../../types/filter.types';

// ============================================
// Helper: 다국어 라벨 가져오기
// ============================================

function getLocalizedLabel(
  filter: CustomFilter,
  locale: string,
  t: ReturnType<typeof useTranslations>
): string {
  // 시스템 필터는 i18n 번역 키 사용 (전체/신규/재방문/단골/휴면 등)
  if (filter.is_system_filter) {
    return t(`customer.filter.${filter.filter_key}`);
  }
  // 커스텀 필터는 locale별 라벨 사용
  switch (locale) {
    case 'en':
      return filter.label_en || filter.label;
    case 'th':
      return filter.label_th || filter.label;
    default:
      return filter.label;
  }
}

// ============================================
// Filter Tab Component
// ============================================

interface FilterTab {
  type: CustomerFilterType;
  label: string;
  count: number;
}

const STAFF_FILTER_PALETTE = [
  {
    active: 'bg-info-500 text-white',
    inactive: 'bg-info-50 text-info-700 hover:bg-info-100',
  },
  {
    active: 'bg-success-500 text-white',
    inactive: 'bg-success-50 text-success-700 hover:bg-success-100',
  },
  {
    active: 'bg-warning-500 text-white',
    inactive: 'bg-warning-50 text-warning-700 hover:bg-warning-100',
  },
  {
    active: 'bg-primary-500 text-white',
    inactive: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
  },
] as const;

// rerender-memo: 필터 탭을 별도 컴포넌트로 분리
const FilterTabs = memo(function FilterTabs({
  tabs,
  activeFilter,
  onFilterChange,
  variant = 'default',
}: {
  tabs: FilterTab[];
  activeFilter: CustomerFilterType;
  onFilterChange: (filter: CustomerFilterType) => void;
  variant?: 'default' | 'staff';
}) {
  return (
    <div className="flex space-x-1.5 overflow-x-auto pb-2 md:space-x-2">
      {tabs.map((tab, index) => {
        const isActive = activeFilter === tab.type;
        const staffPalette = STAFF_FILTER_PALETTE[index % STAFF_FILTER_PALETTE.length];
        const stateClass =
          variant === 'staff'
            ? isActive
              ? staffPalette.active
              : staffPalette.inactive
            : isActive
              ? 'bg-primary-500 text-white'
              : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200';

        return (
          <button
            key={tab.type}
            type="button"
            className={`h-9 rounded-lg whitespace-nowrap border px-3 text-sm font-medium transition-colors md:h-10 md:px-4 md:text-base ${
              isActive ? 'border-transparent' : 'border-secondary-200'
            } ${stateClass}`}
            onClick={() => onFilterChange(tab.type)}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-75 md:ml-2 md:text-sm">({tab.count})</span>
          </button>
        );
      })}
    </div>
  );
});

// ============================================
// Filter Conditions Display Component
// ============================================

const FilterConditionsDisplay = memo(function FilterConditionsDisplay({
  filter,
  t,
  locale,
}: {
  filter: CustomFilter | null;
  t: (key: string) => string;
  locale: string;
}) {
  if (!filter || filter.conditions.length === 0) {
    return null;
  }

  // 조건들을 자연스러운 문장 형태로 포맷
  const formatConditionsNaturally = () => {
    const conditions = filter.conditions;
    const parts: string[] = [];
    const filterKey = filter.filter_key;

    // 각 조건을 분석하여 자연스러운 표현으로 변환
    const daysCondition = conditions.find(c => c.field === 'days_since_last_visit');
    const registrationCondition = conditions.find(c => c.field === 'days_since_registration');
    const visitsCondition = conditions.find(c => c.field === 'total_visits');
    const spentCondition = conditions.find(c => c.field === 'total_spent');
    const noShowCondition = conditions.find(c => c.field === 'no_show_count');
    const artistCondition = conditions.find(c => c.field === 'has_primary_artist');

    if (locale === 'ko') {
      // 신규고객: "고객 등록일 30일 이내"
      if (filterKey === 'new' && registrationCondition) {
        const days = registrationCondition.value as number;
        const op = registrationCondition.operator;
        const opText = op === '<=' ? '이내' : op === '<' ? '미만' : op === '>=' ? '이상' : op === '>' ? '초과' : '';
        parts.push(`고객 등록일 ${days}일 ${opText}`);
      }
      // 재방문 고객: "방문 횟수 2회 이상"
      else if (filterKey === 'returning' && visitsCondition) {
        const visits = visitsCondition.value as number;
        const op = visitsCondition.operator;
        const opText = op === '>=' ? '이상' : op === '>' ? '초과' : op === '<=' ? '이하' : op === '<' ? '미만' : '';
        parts.push(`방문 횟수 ${visits}회 ${opText}`);
      }
      // 단골고객: "방문 횟수 3개월 이내, 3회 이상" 형태
      else if (daysCondition && visitsCondition) {
        const days = daysCondition.value as number;
        const daysOp = daysCondition.operator;
        const visits = visitsCondition.value as number;
        const visitsOp = visitsCondition.operator;

        const daysText = daysOp === '<=' ? `${days}일 이내` : daysOp === '<' ? `${days}일 미만` : daysOp === '>=' ? `${days}일 이상` : daysOp === '>' ? `${days}일 초과` : `${days}일`;
        const visitsText = visitsOp === '>=' ? `${visits}회 이상` : visitsOp === '>' ? `${visits}회 초과` : visitsOp === '<=' ? `${visits}회 이하` : visitsOp === '<' ? `${visits}회 미만` : `${visits}회`;

        parts.push(`방문 횟수 ${daysText}, ${visitsText}`);
      } else {
        // 개별 조건 처리
        if (registrationCondition) {
          const days = registrationCondition.value as number;
          const op = registrationCondition.operator;
          const opText = op === '<=' ? '이내' : op === '<' ? '미만' : op === '>=' ? '이상' : op === '>' ? '초과' : '';
          parts.push(`고객 등록일 ${days}일 ${opText}`);
        }
        if (daysCondition) {
          const days = daysCondition.value as number;
          const op = daysCondition.operator;
          const opText = op === '<=' ? '이내' : op === '<' ? '미만' : op === '>=' ? '이상' : op === '>' ? '초과' : '';
          parts.push(`마지막 방문 ${days}일 ${opText}`);
        }
        if (visitsCondition) {
          const visits = visitsCondition.value as number;
          const op = visitsCondition.operator;
          const opText = op === '>=' ? '이상' : op === '>' ? '초과' : op === '<=' ? '이하' : op === '<' ? '미만' : '';
          parts.push(`방문 횟수 ${visits}회 ${opText}`);
        }
      }

      if (spentCondition) {
        const spent = (spentCondition.value as number).toLocaleString();
        const op = spentCondition.operator;
        const opText = op === '>=' ? '이상' : op === '>' ? '초과' : op === '<=' ? '이하' : op === '<' ? '미만' : '';
        parts.push(`총 지출 ${spent}원 ${opText}`);
      }

      if (noShowCondition) {
        const count = noShowCondition.value as number;
        const op = noShowCondition.operator;
        const opText = op === '>=' ? '이상' : op === '>' ? '초과' : op === '<=' ? '이하' : op === '<' ? '미만' : op === '==' ? '' : '';
        parts.push(`노쇼 ${count}회 ${opText}`);
      }

      if (artistCondition) {
        const hasArtist = artistCondition.value as boolean;
        parts.push(hasArtist ? '담당자 지정됨' : '담당자 미지정');
      }
    } else if (locale === 'en') {
      // English
      // New customer: "Registered within 30 days"
      if (filterKey === 'new' && registrationCondition) {
        const days = registrationCondition.value as number;
        const op = registrationCondition.operator;
        const opText = op === '<=' ? 'within' : op === '<' ? 'less than' : op === '>=' ? 'at least' : op === '>' ? 'more than' : '';
        parts.push(`Registered ${opText} ${days} days`);
      }
      // Returning customer: "2+ visits"
      else if (filterKey === 'returning' && visitsCondition) {
        const visits = visitsCondition.value as number;
        const op = visitsCondition.operator;
        const opText = op === '>=' ? '+' : op === '>' ? '+ (more than)' : op === '<=' ? ' or less' : op === '<' ? ' (less than)' : '';
        parts.push(`${visits}${opText} visits`);
      }
      // Regular customer with both conditions
      else if (daysCondition && visitsCondition) {
        const days = daysCondition.value as number;
        const daysOp = daysCondition.operator;
        const visits = visitsCondition.value as number;
        const visitsOp = visitsCondition.operator;

        const daysText = daysOp === '<=' ? `within ${days} days` : daysOp === '<' ? `less than ${days} days` : daysOp === '>=' ? `${days}+ days` : daysOp === '>' ? `more than ${days} days` : `${days} days`;
        const visitsText = visitsOp === '>=' ? `${visits}+ visits` : visitsOp === '>' ? `more than ${visits} visits` : visitsOp === '<=' ? `up to ${visits} visits` : visitsOp === '<' ? `less than ${visits} visits` : `${visits} visits`;

        parts.push(`${daysText}, ${visitsText}`);
      } else {
        if (registrationCondition) {
          const days = registrationCondition.value as number;
          const op = registrationCondition.operator;
          const opText = op === '<=' ? 'within' : op === '<' ? 'less than' : op === '>=' ? 'at least' : op === '>' ? 'more than' : '';
          parts.push(`Registered ${opText} ${days} days`);
        }
        if (daysCondition) {
          const days = daysCondition.value as number;
          const op = daysCondition.operator;
          const opText = op === '<=' ? 'within' : op === '<' ? 'less than' : op === '>=' ? 'at least' : op === '>' ? 'more than' : '';
          parts.push(`Last visit ${opText} ${days} days`);
        }
        if (visitsCondition) {
          const visits = visitsCondition.value as number;
          const op = visitsCondition.operator;
          const opText = op === '>=' ? '+' : op === '>' ? '+ (more than)' : op === '<=' ? ' or less' : op === '<' ? ' (less than)' : '';
          parts.push(`${visits}${opText} visits`);
        }
      }

      if (spentCondition) {
        const spent = (spentCondition.value as number).toLocaleString();
        const op = spentCondition.operator;
        const opText = op === '>=' ? 'or more' : op === '>' ? 'more than' : op === '<=' ? 'or less' : op === '<' ? 'less than' : '';
        parts.push(`Spent ${spent}+ KRW ${opText}`);
      }

      if (noShowCondition) {
        const count = noShowCondition.value as number;
        const op = noShowCondition.operator;
        const opText = op === '>=' ? 'or more' : op === '>' ? 'more than' : op === '<=' ? 'or less' : op === '<' ? 'less than' : '';
        parts.push(`${count} no-shows ${opText}`);
      }

      if (artistCondition) {
        const hasArtist = artistCondition.value as boolean;
        parts.push(hasArtist ? 'Has primary artist' : 'No primary artist');
      }
    } else {
      // Thai
      // New customer: "ลงทะเบียนภายใน 30 วัน"
      if (filterKey === 'new' && registrationCondition) {
        const days = registrationCondition.value as number;
        const op = registrationCondition.operator;
        const opText = op === '<=' ? 'ภายใน' : op === '<' ? 'น้อยกว่า' : op === '>=' ? 'อย่างน้อย' : op === '>' ? 'มากกว่า' : '';
        parts.push(`ลงทะเบียน ${opText} ${days} วัน`);
      }
      // Returning customer: "2 ครั้งขึ้นไป"
      else if (filterKey === 'returning' && visitsCondition) {
        const visits = visitsCondition.value as number;
        const op = visitsCondition.operator;
        const opText = op === '>=' ? 'ขึ้นไป' : op === '>' ? 'มากกว่า' : op === '<=' ? 'หรือน้อยกว่า' : op === '<' ? 'น้อยกว่า' : '';
        parts.push(`${visits} ครั้ง${opText}`);
      }
      // Regular customer with both conditions
      else if (daysCondition && visitsCondition) {
        const days = daysCondition.value as number;
        const daysOp = daysCondition.operator;
        const visits = visitsCondition.value as number;
        const visitsOp = visitsCondition.operator;

        const daysText = daysOp === '<=' ? `ภายใน ${days} วัน` : daysOp === '<' ? `น้อยกว่า ${days} วัน` : daysOp === '>=' ? `${days} วันขึ้นไป` : daysOp === '>' ? `มากกว่า ${days} วัน` : `${days} วัน`;
        const visitsText = visitsOp === '>=' ? `${visits} ครั้งขึ้นไป` : visitsOp === '>' ? `มากกว่า ${visits} ครั้ง` : visitsOp === '<=' ? `ไม่เกิน ${visits} ครั้ง` : visitsOp === '<' ? `น้อยกว่า ${visits} ครั้ง` : `${visits} ครั้ง`;

        parts.push(`${daysText}, ${visitsText}`);
      } else {
        if (registrationCondition) {
          const days = registrationCondition.value as number;
          const op = registrationCondition.operator;
          const opText = op === '<=' ? 'ภายใน' : op === '<' ? 'น้อยกว่า' : op === '>=' ? 'อย่างน้อย' : op === '>' ? 'มากกว่า' : '';
          parts.push(`ลงทะเบียน ${opText} ${days} วัน`);
        }
        if (daysCondition) {
          const days = daysCondition.value as number;
          const op = daysCondition.operator;
          const opText = op === '<=' ? 'ภายใน' : op === '<' ? 'น้อยกว่า' : op === '>=' ? 'อย่างน้อย' : op === '>' ? 'มากกว่า' : '';
          parts.push(`เข้าล่าสุด ${opText} ${days} วัน`);
        }
        if (visitsCondition) {
          const visits = visitsCondition.value as number;
          const op = visitsCondition.operator;
          const opText = op === '>=' ? 'ขึ้นไป' : op === '>' ? 'มากกว่า' : op === '<=' ? 'หรือน้อยกว่า' : op === '<' ? 'น้อยกว่า' : '';
          parts.push(`${visits} ครั้ง${opText}`);
        }
      }

      if (spentCondition) {
        const spent = (spentCondition.value as number).toLocaleString();
        const op = spentCondition.operator;
        const opText = op === '>=' ? 'ขึ้นไป' : op === '>' ? 'มากกว่า' : op === '<=' ? 'หรือน้อยกว่า' : op === '<' ? 'น้อยกว่า' : '';
        parts.push(`ใช้จ่าย ${spent} วอน${opText}`);
      }

      if (noShowCondition) {
        const count = noShowCondition.value as number;
        const op = noShowCondition.operator;
        const opText = op === '>=' ? 'ขึ้นไป' : op === '>' ? 'มากกว่า' : op === '<=' ? 'หรือน้อยกว่า' : op === '<' ? 'น้อยกว่า' : '';
        parts.push(`ไม่มา ${count} ครั้ง${opText}`);
      }

      if (artistCondition) {
        const hasArtist = artistCondition.value as boolean;
        parts.push(hasArtist ? 'มีช่างประจำ' : 'ไม่มีช่างประจำ');
      }
    }

    return parts.join(', ');
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs md:text-sm">
      <Filter size={14} className="text-primary-500 flex-shrink-0" />
      <span className="text-primary-700 font-medium">
        {formatConditionsNaturally()}
      </span>
    </div>
  );
});

// ============================================
// Sort Dropdown Component
// ============================================

const SortDropdown = memo(function SortDropdown({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  t,
}: {
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: CustomerSortBy) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  t: (key: string) => string;
}) {
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortByChange(e.target.value as CustomerSortBy);
    },
    [onSortByChange]
  );

  const handleToggleOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <select
        value={sortBy}
        onChange={handleSortChange}
        className="h-10 flex-1 rounded-lg border border-secondary-200 bg-white px-3 text-sm text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 md:h-11 md:text-base"
      >
        <option value="last_visit">{t('customer.sort.lastVisit')}</option>
        <option value="total_visits">{t('customer.sort.totalVisits')}</option>
        <option value="total_spent">{t('customer.sort.totalSpent')}</option>
        <option value="name">{t('customer.sort.name')}</option>
        <option value="created_at">{t('customer.sort.createdAt')}</option>
      </select>
      <button
        type="button"
        className={`h-10 w-10 flex items-center justify-center rounded-lg border border-secondary-200 bg-white text-secondary-700 transition-transform hover:bg-secondary-50 md:h-11 md:w-11 ${
          sortOrder === 'desc' ? 'rotate-180' : ''
        }`}
        onClick={handleToggleOrder}
        title={sortOrder === 'asc' ? t('common.sort.asc') : t('common.sort.desc')}
      >
        <ArrowUpDown size={18} />
      </button>
    </div>
  );
});

// ============================================
// Artist Filter Tab Interface
// ============================================

export interface ArtistFilterTab {
  artistId: string;
  artistName: string;
  count: number;
}

// ============================================
// Main Component
// ============================================

interface CustomerPageHeaderProps {
  activeFilter: CustomerFilterType;
  searchQuery: string;
  filterCounts: Record<CustomerBaseFilterType, number>;
  artistFilters?: ArtistFilterTab[];
  /** 커스텀 필터 목록 (DB에서 로드) */
  customFilters?: CustomFilter[];
  /** 커스텀 필터별 카운트 */
  customFilterCounts?: Record<string, number>;
  onFilterChange: (filter: CustomerFilterType) => void;
  onSearchChange: (query: string) => void;
  sortBy: CustomerSortBy;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: CustomerSortBy) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onAddCustomer: () => void;
  /** 필터 설정 모달 열기 */
  onOpenFilterSettings?: () => void;
  /** 고객 등록 권한 */
  canAddCustomer?: boolean;
}

export const CustomerPageHeader = memo(function CustomerPageHeader({
  activeFilter,
  searchQuery,
  filterCounts,
  artistFilters = [],
  customFilters = [],
  customFilterCounts = {},
  onFilterChange,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  onAddCustomer,
  onOpenFilterSettings,
  canAddCustomer = true,
}: CustomerPageHeaderProps) {
  const t = useTranslations();
  const locale = useLocale();

  // advanced-event-handler-refs: 안정적인 이벤트 핸들러
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  // 커스텀 필터가 있으면 사용, 없으면 기본 필터 사용
  const useCustomFilters = customFilters.length > 0;

  // 현재 선택된 필터 찾기
  const activeCustomFilter = useMemo(() => {
    if (!useCustomFilters) return null;
    return customFilters.find((f) => f.filter_key === activeFilter) || null;
  }, [customFilters, activeFilter, useCustomFilters]);

  // 커스텀 필터 탭 데이터 (DB 기반) - 다국어 지원
  const customFilterTabs: FilterTab[] = useCustomFilters
    ? customFilters.map((filter) => ({
        type: filter.filter_key as CustomerFilterType,
        label: getLocalizedLabel(filter, locale, t),
        count: customFilterCounts[filter.filter_key] ?? 0,
      }))
    : [];

  // 기본 필터 탭 데이터 (fallback용)
  const baseFilterTabs: FilterTab[] = useCustomFilters
    ? []
    : [
        { type: 'all', label: t('customer.filter.all'), count: filterCounts.all },
        { type: 'new', label: t('customer.filter.new'), count: filterCounts.new },
        {
          type: 'returning',
          label: t('customer.filter.returning'),
          count: filterCounts.returning,
        },
        {
          type: 'regular',
          label: t('customer.filter.regular'),
          count: filterCounts.regular,
        },
        {
          type: 'dormant',
          label: t('customer.filter.dormant'),
          count: filterCounts.dormant,
        },
        { type: 'vip', label: t('customer.filter.vip'), count: filterCounts.vip },
        { type: 'foreign', label: t('customer.filter.foreign'), count: filterCounts.foreign },
      ];

  // 담당자별 필터 탭 데이터
  const artistFilterTabs: FilterTab[] = artistFilters.map((artist) => ({
    type: `artist:${artist.artistId}` as CustomerFilterType,
    label: artist.artistName,
    count: artist.count,
  }));

  return (
    <div className="space-y-4">
      {/* Title and Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary-900 sm:text-2xl lg:text-3xl">
            {t('customer.title')}
          </h1>
          <p className="mt-1 text-sm text-secondary-600 sm:text-base">
            {t('customer.pageDescription')}
          </p>
        </div>
        {canAddCustomer && (
          <Button
            onClick={onAddCustomer}
            className="h-10 shrink-0 gap-1.5 px-3 text-sm sm:h-11 sm:gap-2 sm:px-4 sm:text-base"
          >
            <Plus size={18} className="sm:h-5 sm:w-5" />
            <span>{t('customer.addNew')}</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs - 커스텀 필터 or 기본 필터 + 담당자 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 커스텀 필터 (DB 기반) */}
        {useCustomFilters && (
          <FilterTabs
            tabs={customFilterTabs}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        )}

        {/* 기본 필터 (fallback) */}
        {!useCustomFilters && (
          <FilterTabs
            tabs={baseFilterTabs}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        )}

        {/* 담당자 필터 구분선 및 탭 */}
        {artistFilterTabs.length > 0 && (
          <>
            <div className="h-8 w-px bg-secondary-300 mx-2" />
            <FilterTabs
              tabs={artistFilterTabs}
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              variant="staff"
            />
          </>
        )}

        {/* 필터 설정 버튼 */}
        {onOpenFilterSettings && (
          <>
            <div className="h-8 w-px bg-secondary-300 mx-2" />
            <button
              type="button"
              onClick={onOpenFilterSettings}
              className="h-9 w-9 rounded-lg text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700 md:h-10 md:w-10"
              title={t('customer.filterManagement.title')}
            >
              <Settings size={18} className="mx-auto" />
            </button>
          </>
        )}
      </div>

      {/* 선택된 필터의 조건 표시 */}
      {activeCustomFilter && activeCustomFilter.conditions.length > 0 && (
        <FilterConditionsDisplay filter={activeCustomFilter} t={t} locale={locale} />
      )}

      {/* Search and Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400"
              size={16}
            />
            <input
              type="text"
              placeholder={t('customer.search.placeholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-10 w-full rounded-lg border border-secondary-200 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:h-11 sm:pl-10 sm:pr-4 sm:text-base"
            />
          </div>
        </div>
        <SortDropdown
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={onSortByChange}
          onSortOrderChange={onSortOrderChange}
          t={t}
        />
      </div>
    </div>
  );
});
