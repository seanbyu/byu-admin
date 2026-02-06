# 알림 시스템

> 예약 관련 알림 발송 및 관리 시스템

## notifications 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| booking_id | UUID | 관련 예약 |
| recipient_type | ENUM | CUSTOMER/ADMIN/ARTIST/STAFF |
| recipient_user_id | UUID | 수신자 (관리자인 경우) |
| recipient_customer_id | UUID | 수신자 (고객인 경우) |
| notification_type | ENUM | 알림 종류 |
| channel | ENUM | LINE/EMAIL/SMS/PUSH |
| title | TEXT | 제목 |
| body | TEXT | 내용 |
| status | ENUM | PENDING/SENT/DELIVERED/READ/FAILED |
| sent_at | TIMESTAMP | 발송 시간 |
| error_message | TEXT | 실패 시 에러 |
| metadata | JSONB | 알림에 사용된 변수 |

## notification_type ENUM 값

| 값 | 설명 |
|------|------|
| `BOOKING_REQUEST` | 예약 요청 (어드민에게) |
| `BOOKING_CONFIRMED` | 예약 확정 (고객에게) |
| `BOOKING_CANCELLED` | 예약 취소 (양쪽에게) |
| `BOOKING_REMINDER` | 리마인더 (고객에게) |
| `BOOKING_COMPLETED` | 완료 (리뷰 요청) |
| `BOOKING_NO_SHOW` | 노쇼 (어드민에게) |
| `BOOKING_MODIFIED` | 예약 변경 (양쪽에게) |
| `REVIEW_RECEIVED` | 리뷰 등록 (어드민에게) |

## 알림 발송 시점

| 이벤트 | 알림 타입 | 수신자 | 채널 |
|--------|----------|--------|------|
| 예약 요청 | BOOKING_REQUEST | 어드민, 담당 아티스트 | LINE, PUSH |
| 예약 확정 | BOOKING_CONFIRMED | 고객 | LINE |
| 예약 취소 | BOOKING_CANCELLED | 고객, 어드민 | LINE |
| 24시간 전 | BOOKING_REMINDER | 고객 | LINE |
| 2시간 전 | BOOKING_REMINDER | 고객 | LINE |
| 노쇼 발생 | BOOKING_NO_SHOW | 어드민 | PUSH |
| 리뷰 등록 | REVIEW_RECEIVED | 어드민 | PUSH |

## 알림 상태 흐름

```
PENDING → SENT → DELIVERED → READ
              ↘
               FAILED (재시도)
```

## 알림 함수

| 함수 | 설명 |
|------|------|
| `create_booking_notification(booking_id, type, recipient, channel, title, body, meta)` | 예약 알림 생성 |
