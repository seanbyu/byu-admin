# 고객 그룹 시스템

> 고객 세분화 및 자동 분류 시스템

## customer_groups (고객 그룹) 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 소속 살롱 |
| name | VARCHAR | 그룹명 |
| name_en | VARCHAR | 그룹명 (영문) |
| name_th | VARCHAR | 그룹명 (태국어) |
| color | VARCHAR | 색상 (#HEX) |
| icon | VARCHAR | 아이콘 이름 |
| description | TEXT | 설명 |
| group_type | ENUM | MANUAL/AUTO/HYBRID |
| auto_assign_rules | JSONB | 자동 분류 규칙 |
| auto_assign_enabled | BOOLEAN | 자동 분류 활성화 여부 |
| last_auto_assigned_at | TIMESTAMP | 마지막 자동 분류 실행 시간 |
| is_active | BOOLEAN | 활성화 여부 |
| display_order | INTEGER | 표시 순서 |

## group_type ENUM 값

| 값 | 설명 |
|------|------|
| `MANUAL` | 수동 할당만 |
| `AUTO` | 자동 할당만 |
| `HYBRID` | 자동 + 수동 |

## customer_group_members (고객-그룹 연결) 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID | 고객 |
| group_id | UUID | 그룹 |
| added_at | TIMESTAMP | 그룹 추가 시간 |
| added_by | UUID | 추가한 스태프 |

## 자동 분류 규칙 (auto_assign_rules JSONB)

```json
{
  "operator": "AND",
  "conditions": [
    {
      "field": "total_spent",
      "operator": ">=",
      "value": 200000
    },
    {
      "field": "total_visits",
      "operator": ">=",
      "value": 5
    }
  ]
}
```

## 지원하는 필드 (field)

| 필드 | 설명 |
|------|------|
| total_spent | 총 매출액 |
| total_visits | 총 방문 횟수 |
| no_show_count | 노쇼 횟수 |
| days_since_registration | 가입 후 경과일 |
| days_since_last_visit | 마지막 방문 후 경과일 |
| grade | 고객 등급 |

## 지원하는 연산자

- `>=`, `>`, `<=`, `<`, `==`, `!=`

## 자동 분류 규칙 예시

### 1. VIP 고객 (매출 20만 이상 AND 방문 5회 이상)
```json
{
  "operator": "AND",
  "conditions": [
    {"field": "total_spent", "operator": ">=", "value": 200000},
    {"field": "total_visits", "operator": ">=", "value": 5}
  ]
}
```

### 2. 신규 고객 (가입 30일 이내)
```json
{
  "operator": "AND",
  "conditions": [
    {"field": "days_since_registration", "operator": "<=", "value": 30}
  ]
}
```

### 3. 휴면 고객 (90일 이상 미방문)
```json
{
  "operator": "AND",
  "conditions": [
    {"field": "days_since_last_visit", "operator": ">=", "value": 90}
  ]
}
```

### 4. 단골 고객 (방문 10회 이상 OR 매출 50만 이상)
```json
{
  "operator": "OR",
  "conditions": [
    {"field": "total_visits", "operator": ">=", "value": 10},
    {"field": "total_spent", "operator": ">=", "value": 500000}
  ]
}
```

### 5. 노쇼 주의 고객 (노쇼 2회 이상)
```json
{
  "operator": "AND",
  "conditions": [
    {"field": "no_show_count", "operator": ">=", "value": 2}
  ]
}
```

## 그룹 자동 분류 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          고객 그룹 자동 분류                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  [매장 관리자]                      [시스템]                        [고객]
       │                              │                              │
       │  1. 그룹 생성 및 규칙 설정    │                              │
       │  ─────────────────────────► │                              │
       │  (예: VIP - 매출 20만 이상)   │                              │
       │                              │                              │
       │                              │  customer_groups 생성         │
       │                              │  auto_assign_rules 저장       │
       │                              │                              │
       │                              │  ════════════════════════    │
       │                              │  (예약 완료/결제 발생 시)       │
       │                              │  ════════════════════════    │
       │                              │                              │
       │                              │  2. 자동 분류 실행             │
       │                              │  - 고객 데이터 조회            │
       │                              │  - 규칙 조건 검사              │
       │                              │  - 조건 만족 시 그룹에 추가     │
       │                              │                              │
       │  3. 그룹별 고객 조회          │                              │
       │  ◄───────────────────────── │                              │
       │  (VIP 고객 목록 확인)         │                              │
       │                              │                              │
       │  4. 그룹별 마케팅 활용        │                              │
       │  ─────────────────────────► │  5. 타겟 알림 발송 ──────────►│
       │  (VIP 고객 대상 쿠폰 발송)    │                              │
       │                              │                              │
       └──────────────────────────────┴──────────────────────────────┘
```

## 그룹 타입 활용 예시

| 그룹 타입 | 설명 | 예시 |
|----------|------|------|
| MANUAL | 수동으로만 할당 | "우수고객 추천", "직원 지인" |
| AUTO | 조건 만족 시 자동 할당 | "VIP", "휴면고객", "노쇼 주의" |
| HYBRID | 자동 + 수동 모두 가능 | "단골고객" (자동 + 예외 추가) |

## 블랙리스트 관리

블랙리스트는 별도 컬럼으로 관리됩니다:

```sql
-- 블랙리스트 등록
UPDATE customers SET
  is_blacklisted = true,
  blacklist_reason = '반복 노쇼',
  blacklisted_at = NOW(),
  blacklisted_by = '스태프ID'
WHERE id = '고객ID';

-- 블랙리스트 해제
UPDATE customers SET
  is_blacklisted = false,
  blacklist_reason = NULL,
  blacklisted_at = NULL,
  blacklisted_by = NULL
WHERE id = '고객ID';
```
