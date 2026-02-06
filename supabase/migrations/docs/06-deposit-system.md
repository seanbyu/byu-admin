# 예약금 시스템

> 예약 시 선결제(예약금) 관리 시스템

## 개요

예약 시 선결제(예약금)를 받을 수 있는 시스템입니다. 태국 PromptPay를 포함한 다양한 결제 수단을 지원합니다.

## 지원 결제 수단

| 결제 수단 | 설명 |
|----------|------|
| PROMPTPAY | 태국 즉시 결제 (QR 코드) |
| LINE_PAY | 라인페이 |
| RABBIT_LINE_PAY | 래빗 라인페이 (태국) |
| TRUE_MONEY | 트루머니 (태국) |
| SHOPEE_PAY | 쇼피페이 |
| CREDIT_CARD | 신용카드 |
| BANK_TRANSFER | 계좌이체 |
| CASH | 현금 |

## bookings 테이블 예약금 필드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| deposit_required | BOOLEAN | 예약금 필요 여부 |
| deposit_amount | DECIMAL | 예약금 금액 |
| deposit_status | ENUM | 상태 (NOT_REQUIRED/PENDING/PAID/REFUNDED/FORFEITED) |
| deposit_paid_at | TIMESTAMP | 결제 시간 |
| deposit_payment_method | ENUM | 결제 수단 |
| deposit_transaction_id | TEXT | 외부 거래 ID |
| deposit_refund_amount | DECIMAL | 환불 금액 |
| deposit_expires_at | TIMESTAMP | 결제 만료 시간 |

## deposit_status ENUM 값

| 값 | 설명 |
|------|------|
| `NOT_REQUIRED` | 예약금 불필요 |
| `PENDING` | 결제 대기 |
| `PAID` | 결제 완료 |
| `PARTIALLY_REFUNDED` | 부분 환불 |
| `REFUNDED` | 전액 환불 |
| `FORFEITED` | 몰수 (노쇼/취소) |

## payments 테이블

모든 결제/환불 기록을 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| booking_id | UUID | 예약 |
| customer_id | UUID | 고객 |
| payment_type | ENUM | DEPOSIT/FULL_PAYMENT/REFUND 등 |
| amount | DECIMAL | 금액 |
| currency | VARCHAR | 통화 (기본: THB) |
| payment_method | ENUM | 결제 수단 |
| status | ENUM | PENDING/COMPLETED/FAILED/REFUNDED |
| provider | VARCHAR | 외부 결제 제공자 (STRIPE, OMISE, 2C2P) |
| provider_transaction_id | TEXT | 외부 거래 ID |
| promptpay_qr_code | TEXT | PromptPay QR 코드 |
| promptpay_ref_id | TEXT | PromptPay 참조 번호 |

## salon_promptpay_settings 테이블

살롱별 PromptPay 설정입니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | 살롱 (UNIQUE) |
| promptpay_id | TEXT | PromptPay ID (전화번호/국민ID) |
| promptpay_type | VARCHAR | PHONE 또는 NATIONAL_ID |
| account_name | TEXT | 계좌주 이름 |
| qr_code_image | TEXT | 정적 QR 코드 이미지 URL |

## 살롱 설정 (salons.settings.deposit)

```json
{
  "enabled": true,
  "type": "PERCENTAGE",
  "amount": 30,
  "min_amount": 500,
  "max_amount": 5000,
  "required_for": "ALL",
  "payment_methods": ["PROMPTPAY", "LINE_PAY", "CREDIT_CARD"],
  "payment_deadline_hours": 24,
  "refund_policy": {
    "full_refund_hours": 48,
    "partial_refund_hours": 24,
    "partial_refund_percent": 50
  },
  "no_show_forfeit": true
}
```

## 예약금 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            예약금 결제 흐름                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  [고객]                           [시스템]                         [살롱]
    │                                │                                │
    │  1. 예약 요청                   │                                │
    │  ──────────────────────────►   │                                │
    │                                │                                │
    │                                │  예약 생성                       │
    │                                │  deposit_required = true       │
    │                                │  deposit_status = 'PENDING'    │
    │                                │                                │
    │  2. PromptPay QR 수신 ◄────────│                                │
    │                                │                                │
    │  3. QR 스캔 / 결제              │                                │
    │  ──────────────────────────►   │                                │
    │                                │                                │
    │                                │  결제 확인                       │
    │                                │  deposit_status = 'PAID'       │
    │                                │  payments 기록 생성             │
    │                                │                                │
    │                                │  4. 알림 발송 ─────────────────►│
    │                                │  (예약금 결제 완료)              │
    │                                │                                │
    │  5. 예약 확정 알림 ◄────────────│                                │
    │                                │                                │
    └────────────────────────────────┴────────────────────────────────┘
```

## 환불 정책 예시

| 취소 시점 | 환불율 |
|----------|--------|
| 48시간 이전 | 100% 전액 환불 |
| 24~48시간 | 50% 부분 환불 |
| 24시간 이내 | 환불 불가 |
| 노쇼 | 예약금 몰수 |
