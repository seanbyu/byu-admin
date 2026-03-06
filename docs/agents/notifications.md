# 알림(Notifications) 도메인 에이전트

> 팀장 에이전트가 알림 관련 작업을 위임할 때 이 파일을 컨텍스트로 주입한다.
> Cline에서: `@docs/agents/notifications.md` 로 참조

---

## 담당 범위

- IN_APP 알림 (어드민 사이드바 패널)
- LINE 알림 (고객 Push)
- Outbox 패턴 유지보수
- DB 트리거 추가/수정
- process-outbox Edge Function

---

## 채널 분리 원칙

| 채널 | 수신자 | 생성 주체 | 전달 방법 |
|---|---|---|---|
| `IN_APP` | 어드민 | DB 트리거 | Supabase Realtime |
| `LINE` | 고객 | DB 트리거 → outbox | process-outbox (pg_cron 1분) |

**두 채널의 로직을 절대 섞지 않는다.**

---

## 핵심 파일 맵

```
src/
├── features/notifications/
│   └── hooks/useNotifications.ts   ← 어드민 알림 목록 조회/읽음 처리
│
├── lib/api-core/notifications/
│   ├── notification.service.ts     ← 오케스트레이터 (onBookingConfirmed 등)
│   ├── types.ts                    ← NotificationTriggerType, DbNotificationType
│   └── triggers/
│       ├── base.trigger.ts         ← fetchBookingPayload, dispatchNotification
│       ├── booking-confirmed.trigger.ts
│       ├── booking-cancelled.trigger.ts
│       └── booking-changed.trigger.ts   ← 일정 직접 변경 (Application Layer)
│
├── components/
│   ├── realtime/BookingRealtimeListener.tsx   ← Realtime 구독, 토스트, 캐시 갱신
│   └── layout/Sidebar/SidebarNotificationPanel.tsx

supabase/
├── migrations/
│   ├── 12_notifications.sql                   ← 기본 스키마
│   ├── 31_notification_outbox_and_triggers.sql ← outbox + DB 트리거
│   └── 32_notifications_outbox_hardening.sql  ← RLS 권한
└── functions/
    └── process-outbox/index.ts                ← LINE 발송 Edge Function
```

---

## 새 알림 타입 추가 시 체크리스트

```
□ 1. DB 트리거가 필요한가?
      → supabase/migrations/{N+1}_{description}.sql 에 트리거 추가
      → 기존 migration 파일 수정 금지

□ 2. Application Layer 트리거가 필요한가?
      → src/lib/api-core/notifications/triggers/ 에 새 trigger 파일 추가
      → notification.service.ts에 onXxx() 메서드 추가

□ 3. IN_APP인가 LINE인가?
      → IN_APP: notifications 테이블 INSERT (channel='IN_APP')
      → LINE: notifications + notification_outbox 동시 INSERT (같은 트랜잭션)

□ 4. LINE이라면 idempotency_key 형식 확인
      → '{booking_id}:{type}:{YYYY-MM-DD}' 형식 유지
      → UNIQUE 제약으로 중복 방지

□ 5. process-outbox에서 새 type 처리 로직 추가했는가?
```

---

## Outbox 상태 머신

```
pending → sending → sent
                 ↘ failed (재시도 카운트 증가)
                       ↘ dead_letter (5회 초과)
```

재시도 지수 백오프: `attempt^2` 분 후 재시도 (1→4→9→16분, 5회째 dead_letter)

---

## LINE 발송 차단 조건

DB 트리거 단계에서 outbox 생성을 스킵:
- `customers.line_user_id IS NULL`
- `customers.opt_out = true`
- `customers.line_blocked = true`

Edge Function 단계에서 failed 처리:
- `salon_line_settings` 레코드 없음 또는 `is_active = false`

---

## 주의사항

- LINE API를 Route Handler나 서비스 레이어에서 직접 호출하지 않는다
- `notification_outbox`의 `FOR UPDATE SKIP LOCKED`는 동시 실행 방지용 — 절대 제거하지 않는다
- `BookingRealtimeListener`의 알림 채널 구독은 `notifications:salon:{id}` 패턴이다
