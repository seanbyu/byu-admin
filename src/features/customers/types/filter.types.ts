// ============================================
// Customer Filter Types
// 고객 필터 커스터마이징 관련 타입 정의
// ============================================

/**
 * 지원하는 필터 조건 필드
 */
export type CustomerFilterField =
  | 'total_visits'
  | 'total_spent'
  | 'days_since_last_visit'
  | 'days_since_registration'
  | 'no_show_count'
  | 'has_primary_artist'
  | 'is_foreign';

/**
 * 숫자 필드용 연산자
 */
export type NumberOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';

/**
 * 불린 필드용 연산자
 */
export type BooleanOperator = '==' | '!=';

/**
 * 모든 연산자 타입
 */
export type FilterOperator = NumberOperator | BooleanOperator;

/**
 * 단일 필터 조건
 */
export interface FilterCondition {
  field: CustomerFilterField;
  operator: FilterOperator;
  value: number | boolean;
}

/**
 * 조건 결합 로직
 */
export type ConditionLogic = 'AND' | 'OR';

/**
 * 커스텀 필터 설정
 */
export interface CustomFilter {
  id: string;
  salon_id: string;
  filter_key: string;
  is_system_filter: boolean;

  // 다국어 라벨
  label: string;
  label_en?: string | null;
  label_th?: string | null;

  // 조건
  conditions: FilterCondition[];
  condition_logic: ConditionLogic;

  // 표시 설정
  display_order: number;
  is_active: boolean;

  // 타임스탬프
  created_at: string;
  updated_at: string;
}

/**
 * 필터 생성 DTO
 */
export interface CreateCustomFilterDto {
  filter_key: string;
  label: string;
  label_en?: string;
  label_th?: string;
  conditions: FilterCondition[];
  condition_logic?: ConditionLogic;
}

/**
 * 필터 수정 DTO
 */
export interface UpdateCustomFilterDto {
  label?: string;
  label_en?: string;
  label_th?: string;
  conditions?: FilterCondition[];
  condition_logic?: ConditionLogic;
  display_order?: number;
  is_active?: boolean;
}

/**
 * 필터 순서 변경 DTO
 */
export interface ReorderFiltersDto {
  filters: { id: string; display_order: number }[];
}

// ============================================
// 필터 필드 메타데이터 (UI용)
// ============================================

export interface FilterFieldMeta {
  labelKey: string;
  type: 'number' | 'boolean';
  operators: FilterOperator[];
  defaultValue: number | boolean;
  unit?: string;
}

export const FILTER_FIELD_META: Record<CustomerFilterField, FilterFieldMeta> = {
  total_visits: {
    labelKey: 'customer.filterManagement.fields.totalVisits',
    type: 'number',
    operators: ['==', '!=', '>', '<', '>=', '<='],
    defaultValue: 0,
    unit: '회',
  },
  total_spent: {
    labelKey: 'customer.filterManagement.fields.totalSpent',
    type: 'number',
    operators: ['==', '!=', '>', '<', '>=', '<='],
    defaultValue: 0,
    unit: '원',
  },
  days_since_last_visit: {
    labelKey: 'customer.filterManagement.fields.daysSinceLastVisit',
    type: 'number',
    operators: ['==', '!=', '>', '<', '>=', '<='],
    defaultValue: 30,
    unit: '일',
  },
  days_since_registration: {
    labelKey: 'customer.filterManagement.fields.daysSinceRegistration',
    type: 'number',
    operators: ['==', '!=', '>', '<', '>=', '<='],
    defaultValue: 30,
    unit: '일',
  },
  no_show_count: {
    labelKey: 'customer.filterManagement.fields.noShowCount',
    type: 'number',
    operators: ['==', '!=', '>', '<', '>=', '<='],
    defaultValue: 0,
    unit: '회',
  },
  has_primary_artist: {
    labelKey: 'customer.filterManagement.fields.hasPrimaryArtist',
    type: 'boolean',
    operators: ['==', '!='],
    defaultValue: true,
  },
  is_foreign: {
    labelKey: 'customer.filterManagement.fields.isForeign',
    type: 'boolean',
    operators: ['==', '!='],
    defaultValue: true,
  },
};

/**
 * 연산자 라벨 (번역 키)
 */
export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  '==': 'customer.filterManagement.operators.eq',
  '!=': 'customer.filterManagement.operators.ne',
  '>': 'customer.filterManagement.operators.gt',
  '<': 'customer.filterManagement.operators.lt',
  '>=': 'customer.filterManagement.operators.gte',
  '<=': 'customer.filterManagement.operators.lte',
};

/**
 * 필터 필드 옵션 목록 (UI 드롭다운용)
 */
export const FILTER_FIELD_OPTIONS: { value: CustomerFilterField; labelKey: string }[] = [
  { value: 'total_visits', labelKey: 'customer.filterManagement.fields.totalVisits' },
  { value: 'total_spent', labelKey: 'customer.filterManagement.fields.totalSpent' },
  { value: 'days_since_last_visit', labelKey: 'customer.filterManagement.fields.daysSinceLastVisit' },
  { value: 'days_since_registration', labelKey: 'customer.filterManagement.fields.daysSinceRegistration' },
  { value: 'no_show_count', labelKey: 'customer.filterManagement.fields.noShowCount' },
  { value: 'has_primary_artist', labelKey: 'customer.filterManagement.fields.hasPrimaryArtist' },
  { value: 'is_foreign', labelKey: 'customer.filterManagement.fields.isForeign' },
];
