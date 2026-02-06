# 주요 함수

> 데이터베이스 헬퍼 함수 및 비즈니스 로직 함수

## RLS 헬퍼 함수

| 함수 | 설명 |
|------|------|
| `get_my_role()` | 현재 사용자의 role 반환 |
| `get_my_salon_id()` | 현재 사용자의 salon_id 반환 |

## 고객 매칭 함수

| 함수 | 설명 |
|------|------|
| `find_customer_by_phone(salon_id, phone)` | 전화번호로 고객 찾기 |
| `link_line_user_to_customer(user_id, salon_id, phone, name, meta)` | LINE 유저-고객 연결 |

## 알림 함수

| 함수 | 설명 |
|------|------|
| `create_booking_notification(booking_id, type, recipient, channel, title, body, meta)` | 예약 알림 생성 |

## 정액권 함수

| 함수 | 설명 |
|------|------|
| `check_deposit_exempt_by_membership(customer_id, salon_id)` | 고객의 예약금 면제 여부 확인 |
| `use_membership(membership_id, booking_id, service_id, amount, staff_id)` | 정액권 사용 처리 |
| `cancel_membership_usage(usage_id, reason, staff_id)` | 정액권 사용 취소 (횟수 복원) |
| `expire_memberships()` | 만료된 정액권 상태 일괄 업데이트 |
