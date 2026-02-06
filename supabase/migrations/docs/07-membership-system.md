# 정액권 시스템

> 살롱에서 판매하는 정액권/멤버십 관리 시스템

## 개요

살롱에서 판매하는 정액권/멤버십을 관리하는 시스템입니다. 횟수제, 기간제, 금액권, 패키지 등 다양한 형태를 지원합니다.

## 정액권 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| COUNT_BASED | 횟수제 | "젤네일 10회권" |
| TIME_BASED | 기간제 | "3개월 무제한 이용권" |
| AMOUNT_BASED | 금액권 | "50,000฿ 선불 충전" |
| BUNDLE | 패키지 | "네일+속눈썹 세트권" |

## membership_plans (정액권 플랜) 테이블

살롱에서 판매하는 정액권 상품 정의입니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| name | VARCHAR | 정액권명 |
| name_en | VARCHAR | 영문명 |
| name_th | VARCHAR | 태국어명 |
| description | TEXT | 설명 |
| membership_type | ENUM | COUNT_BASED/TIME_BASED/AMOUNT_BASED/BUNDLE |
| price | DECIMAL | 판매가 |
| original_price | DECIMAL | 정가 (할인 표시용) |
| currency | VARCHAR | 통화 (기본: THB) |
| total_count | INTEGER | 총 횟수 (횟수제) |
| valid_days | INTEGER | 유효기간 (일) |
| total_amount | DECIMAL | 총 금액 (금액권) |
| applicable_service_ids | UUID[] | 사용 가능 서비스 ID |
| applicable_category_ids | UUID[] | 사용 가능 카테고리 ID |
| bundle_items | JSONB | 패키지 구성 (BUNDLE 타입) |
| deposit_exempt | BOOLEAN | 예약금 면제 여부 |
| is_active | BOOLEAN | 판매 중 여부 |
| display_order | INTEGER | 표시 순서 |
| max_purchases_per_customer | INTEGER | 고객당 최대 구매 수 |
| terms_and_conditions | TEXT | 이용약관 |

### bundle_items JSONB 구조

```json
[
  {
    "service_id": "uuid",
    "service_name": "젤네일",
    "count": 5
  },
  {
    "service_id": "uuid",
    "service_name": "속눈썹 연장",
    "count": 3
  }
]
```

## customer_memberships (고객 정액권) 테이블

고객이 구매한 정액권 정보입니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| customer_id | UUID | 고객 |
| plan_id | UUID | 정액권 플랜 |
| status | ENUM | PENDING/ACTIVE/EXPIRED/EXHAUSTED/CANCELLED/SUSPENDED |
| remaining_count | INTEGER | 남은 횟수 (횟수제) |
| remaining_amount | DECIMAL | 남은 금액 (금액권) |
| bundle_remaining | JSONB | 패키지별 남은 횟수 |
| purchased_at | TIMESTAMP | 구매 시간 |
| activated_at | TIMESTAMP | 활성화 시간 |
| expires_at | TIMESTAMP | 만료 시간 |
| activation_type | ENUM | IMMEDIATE/ON_FIRST_USE |
| payment_id | UUID | 결제 정보 |
| sold_by | UUID | 판매 스태프 |
| notes | TEXT | 메모 |

### membership_status ENUM 값

| 값 | 설명 |
|------|------|
| `PENDING` | 결제 대기 |
| `ACTIVE` | 사용 중 |
| `EXPIRED` | 기간 만료 |
| `EXHAUSTED` | 소진 완료 |
| `CANCELLED` | 취소/환불 |
| `SUSPENDED` | 일시 중지 |

### bundle_remaining JSONB 구조

```json
[
  {
    "service_id": "uuid",
    "service_name": "젤네일",
    "total": 5,
    "remaining": 3,
    "used": 2
  },
  {
    "service_id": "uuid",
    "service_name": "속눈썹 연장",
    "total": 3,
    "remaining": 3,
    "used": 0
  }
]
```

## membership_usages (정액권 사용 기록) 테이블

정액권 사용 이력을 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| membership_id | UUID | 고객 정액권 |
| booking_id | UUID | 예약 |
| service_id | UUID | 사용한 서비스 |
| used_count | INTEGER | 사용 횟수 (기본: 1) |
| used_amount | DECIMAL | 사용 금액 (금액권) |
| used_at | TIMESTAMP | 사용 시간 |
| used_by | UUID | 처리 스태프 |
| is_cancelled | BOOLEAN | 취소 여부 |
| cancelled_at | TIMESTAMP | 취소 시간 |
| cancelled_by | UUID | 취소 처리 스태프 |
| cancel_reason | TEXT | 취소 사유 |

## bookings 테이블 정액권 관련 필드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| membership_id | UUID | 사용한 정액권 |
| membership_usage_id | UUID | 정액권 사용 기록 |
| deposit_exempt_by_membership | BOOLEAN | 정액권으로 인한 예약금 면제 여부 |

## 정액권 + 예약금 연동

정액권 보유자의 예약금 면제 로직:

1. `membership_plans.deposit_exempt = true`인 정액권 보유 시
2. 예약 생성 시 `check_deposit_exempt_by_membership()` 함수 호출
3. 면제 대상이면 `bookings.deposit_exempt_by_membership = true` 설정
4. `bookings.deposit_required = false`로 예약금 면제

## 주요 함수

| 함수 | 설명 |
|------|------|
| `check_deposit_exempt_by_membership(customer_id, salon_id)` | 고객의 예약금 면제 여부 확인 |
| `use_membership(membership_id, booking_id, service_id, amount, staff_id)` | 정액권 사용 처리 |
| `cancel_membership_usage(usage_id, reason, staff_id)` | 정액권 사용 취소 |
| `expire_memberships()` | 만료된 정액권 상태 업데이트 |

## 정액권 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            정액권 구매 및 사용 흐름                             │
└─────────────────────────────────────────────────────────────────────────────┘

  [고객]                           [시스템]                         [살롱]
    │                                │                                │
    │  1. 정액권 구매 요청            │                                │
    │  ──────────────────────────►   │                                │
    │                                │                                │
    │                                │  customer_memberships 생성      │
    │                                │  status = 'PENDING'            │
    │                                │                                │
    │  2. 결제 완료                   │                                │
    │  ──────────────────────────►   │                                │
    │                                │                                │
    │                                │  status = 'ACTIVE'             │
    │                                │  activated_at = NOW()          │
    │                                │  expires_at 계산                │
    │                                │                                │
    │  3. 예약 요청 (정액권 사용)      │                                │
    │  ──────────────────────────►   │                                │
    │                                │                                │
    │                                │  예약금 면제 여부 확인            │
    │                                │  (check_deposit_exempt_by_     │
    │                                │   membership 함수)              │
    │                                │                                │
    │                                │  [면제 대상]                     │
    │                                │  → deposit_required = false    │
    │                                │  → deposit_exempt_by_          │
    │                                │    membership = true           │
    │                                │                                │
    │                                │  예약 확정 시 정액권 차감         │
    │                                │  → use_membership() 호출        │
    │                                │  → membership_usages 기록       │
    │                                │  → remaining_count 감소         │
    │                                │                                │
    │  4. 잔여 횟수 확인 ◄────────────│                                │
    │                                │                                │
    └────────────────────────────────┴────────────────────────────────┘
```

## 정액권 상태 전이

```
  PENDING ─────────┬────────► ACTIVE
  (결제 대기)       │          (사용 중)
                   │             │
                   │      ┌──────┴──────┐
                   │      │             │
                   ▼      ▼             ▼
             CANCELLED  EXHAUSTED    EXPIRED
             (취소)     (소진)       (만료)
                              │
                              │
                              ▼
                          SUSPENDED
                          (일시 중지)
```
