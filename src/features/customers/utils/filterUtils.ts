import type { CustomerListItem } from '../types';
import type {
  CustomFilter,
  FilterCondition,
  CustomerFilterField,
} from '../types/filter.types';

// ============================================
// Filter Utility Functions
// 커스텀 필터 조건을 고객 데이터에 적용
// ============================================

/**
 * 고객 데이터에서 필드 값을 추출
 */
function getFieldValue(
  customer: CustomerListItem,
  field: CustomerFilterField
): number | boolean {
  switch (field) {
    case 'total_visits':
      return customer.total_visits ?? 0;

    case 'total_spent':
      return customer.total_spent ?? 0;

    case 'days_since_last_visit':
      if (!customer.last_visit) {
        return Infinity; // 방문 기록 없으면 무한대 (오래됨)
      }
      const lastVisitDate = new Date(customer.last_visit);
      const now = new Date();
      const diffTime = now.getTime() - lastVisitDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;

    case 'days_since_registration':
      if (!customer.created_at) {
        return Infinity;
      }
      const createdDate = new Date(customer.created_at);
      const today = new Date();
      const regDiffTime = today.getTime() - createdDate.getTime();
      const regDiffDays = Math.floor(regDiffTime / (1000 * 60 * 60 * 24));
      return regDiffDays;

    case 'no_show_count':
      return (customer as any).no_show_count ?? 0;

    case 'has_primary_artist':
      return !!customer.primary_artist_id;

    default:
      return 0;
  }
}

/**
 * 단일 조건 평가
 */
function evaluateCondition(
  customer: CustomerListItem,
  condition: FilterCondition
): boolean {
  const { field, operator, value } = condition;
  const customerValue = getFieldValue(customer, field);

  // 불린 타입 처리
  if (typeof value === 'boolean') {
    if (operator === '==') return customerValue === value;
    if (operator === '!=') return customerValue !== value;
    return true;
  }

  // 숫자 타입 처리
  const numValue = value as number;
  const numCustomerValue = customerValue as number;

  switch (operator) {
    case '==':
      return numCustomerValue === numValue;
    case '!=':
      return numCustomerValue !== numValue;
    case '>':
      return numCustomerValue > numValue;
    case '<':
      return numCustomerValue < numValue;
    case '>=':
      return numCustomerValue >= numValue;
    case '<=':
      return numCustomerValue <= numValue;
    default:
      return true;
  }
}

/**
 * 커스텀 필터로부터 필터 함수 생성
 */
export function createFilterFunction(
  filter: CustomFilter
): (customer: CustomerListItem) => boolean {
  // 'all' 필터 또는 조건 없는 경우 모두 통과
  if (filter.filter_key === 'all' || filter.conditions.length === 0) {
    return () => true;
  }

  return (customer: CustomerListItem) => {
    const results = filter.conditions.map((condition) =>
      evaluateCondition(customer, condition)
    );

    // AND: 모든 조건 충족, OR: 하나라도 충족
    if (filter.condition_logic === 'AND') {
      return results.every(Boolean);
    } else {
      return results.some(Boolean);
    }
  };
}

/**
 * 커스텀 필터 목록에서 특정 필터 키로 필터 찾기
 */
export function findFilterByKey(
  filters: CustomFilter[],
  filterKey: string
): CustomFilter | undefined {
  return filters.find((f) => f.filter_key === filterKey);
}

/**
 * 모든 커스텀 필터에 대한 카운트 계산
 */
export function calculateFilterCounts(
  customers: CustomerListItem[],
  filters: CustomFilter[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const filter of filters) {
    if (filter.filter_key === 'all') {
      counts[filter.filter_key] = customers.length;
    } else {
      const filterFn = createFilterFunction(filter);
      counts[filter.filter_key] = customers.filter(filterFn).length;
    }
  }

  return counts;
}

/**
 * 고객 목록 필터링
 * @param customers 전체 고객 목록
 * @param filter 적용할 커스텀 필터
 * @param searchQuery 검색어 (optional)
 */
export function filterCustomers(
  customers: CustomerListItem[],
  filter: CustomFilter | null,
  searchQuery?: string
): CustomerListItem[] {
  let result = customers;

  // 커스텀 필터 적용
  if (filter && filter.filter_key !== 'all') {
    const filterFn = createFilterFunction(filter);
    result = result.filter(filterFn);
  }

  // 검색어 적용
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    result = result.filter((customer) => {
      const name = customer.name?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';
      const email = customer.email?.toLowerCase() || '';
      return name.includes(query) || phone.includes(query) || email.includes(query);
    });
  }

  return result;
}

/**
 * 기본 필터 키인지 확인
 */
export function isSystemFilterKey(filterKey: string): boolean {
  const systemKeys = ['all', 'new', 'returning', 'regular', 'dormant', 'vip'];
  return systemKeys.includes(filterKey);
}

/**
 * 유니크한 필터 키 생성
 */
export function generateFilterKey(existingKeys: string[]): string {
  let counter = 1;
  let key = `custom_${counter}`;

  while (existingKeys.includes(key)) {
    counter++;
    key = `custom_${counter}`;
  }

  return key;
}
