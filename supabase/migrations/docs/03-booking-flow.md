# 예약 흐름

> 살롱 예약 시스템의 전체 예약 프로세스

## 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              예약 흐름                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  [고객]                           [시스템]                         [어드민]
    │                                │                                │
    │  1. 살롱/아티스트/시간 선택     │                                │
    │  ──────────────────────────►   │                                │
    │                                │                                │
    │                                │  bookings 생성                  │
    │                                │  status: PENDING               │
    │                                │                                │
    │                                │  2. 알림 발송 ─────────────────►│
    │                                │  (BOOKING_REQUEST)             │
    │                                │                                │
    │                                │  notifications 생성             │
    │                                │  type: BOOKING_REQUEST         │
    │                                │  recipient: ADMIN/ARTIST       │
    │                                │                                │
    │                                │                   3. 확정 클릭  │
    │                                │  ◄─────────────────────────────│
    │                                │                                │
    │                                │  bookings 업데이트              │
    │                                │  status: CONFIRMED             │
    │                                │  confirmed_by: 스태프ID        │
    │                                │  confirmed_at: NOW()           │
    │                                │                                │
    │  4. LINE 알림 수신 ◄───────────│                                │
    │  (BOOKING_CONFIRMED)           │                                │
    │                                │  notifications 생성             │
    │                                │  type: BOOKING_CONFIRMED       │
    │                                │  recipient: CUSTOMER           │
    │                                │                                │
    │                                │  ════════════════════════════  │
    │                                │  (예약 시간 24시간/2시간 전)     │
    │                                │  ════════════════════════════  │
    │                                │                                │
    │  5. 리마인더 알림 ◄────────────│                                │
    │  (BOOKING_REMINDER)            │                                │
    │                                │                                │
    └────────────────────────────────┴────────────────────────────────┘
```

## 예약 상태 (status)

| 상태 | 설명 |
|------|------|
| `PENDING` | 예약 대기 (고객이 예약 요청) |
| `CONFIRMED` | 예약 확정 (어드민이 확정) |
| `IN_PROGRESS` | 시술 중 |
| `COMPLETED` | 완료 |
| `CANCELLED` | 취소됨 |
| `NO_SHOW` | 노쇼 |

## 예약 확정 시 LINE 메시지 예시

```
📌 예약이 확정되었습니다

━━━━━━━━━━━━━━━━━━
🏠 네일살롱 강남점
👤 김디자이너
📅 2024년 3월 15일 (금)
⏰ 14:00 - 15:30
💅 젤네일 + 아트
━━━━━━━━━━━━━━━━━━

⚠️ 예약 변경 및 취소는 예약시간
4시간 전까지 가능합니다.

이후에는 매장으로 연락해주세요.
📞 02-1234-5678
```

## bookings 테이블 주요 필드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| customer_id | UUID | 고객 |
| artist_id | UUID | 담당 아티스트 |
| service_id | UUID | 서비스 |
| booking_date | DATE | 예약일 |
| start_time | TIME | 시작 시간 |
| end_time | TIME | 종료 시간 |
| status | ENUM | 예약 상태 |
| payment_status | ENUM | 결제 상태 |
| total_price | DECIMAL | 총 금액 |
| confirmed_by | UUID | 확정한 스태프 |
| confirmed_at | TIMESTAMP | 확정 시간 |
| cancelled_by | UUID | 취소한 사람 |
| cancelled_at | TIMESTAMP | 취소 시간 |
| booking_meta | JSONB | 예약 채널 정보 |

## booking_meta JSONB 구조

```json
{
  "channel": "line_liff",
  "device": "mobile",
  "utm_source": "line",
  "coupon_code": "SUMMER20"
}
```
