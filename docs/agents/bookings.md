# 예약(Bookings) 도메인 에이전트

> 팀장 에이전트가 예약 관련 작업을 위임할 때 이 파일을 컨텍스트로 주입한다.
> Cline에서: `@docs/agents/bookings.md` 로 참조

---

## 담당 범위

- 예약 생성 / 수정 / 확정 / 취소 플로우
- 예약 차트(StaffDaySheetView) UI
- 예약 설정(BookingSettings)
- 예약 실시간 갱신(BookingRealtimeListener)
- 매출 등록 모달(SalesRegistrationModal)

---

## 핵심 파일 맵

```
src/features/bookings/
├── api.ts                          ← 클라이언트 fetch 함수
├── types.ts                        ← BookingResponse, BookingStatus 등
├── constants.ts                    ← 상태값 상수
├── hooks/
│   ├── queries.ts                  ← bookingKeys, BOOKINGS_QUERY_OPTIONS
│   └── useSalonSettings.ts         ← 살롱 영업시간/설정 조회
├── stores/
│   ├── bookingsStore.ts            ← 선택된 날짜, 하이라이트 ID 등 UI 상태
│   └── settingsStore.ts            ← 설정 UI 상태
└── views/
    ├── components/
    │   ├── StaffDaySheetView/      ← 예약 차트 (핵심 UI)
    │   │   ├── StaffAccordionItem.tsx
    │   │   ├── StaffBookingTable.tsx
    │   │   ├── StaffBookingMobileList.tsx
    │   │   └── utils.ts
    │   ├── NewBookingModal/        ← 신규 예약 생성
    │   └── SalesRegistrationModal/ ← 매출 등록

src/app/api/salons/[salonId]/bookings/
└── [bookingId]/route.ts            ← PATCH confirm/cancel/update

src/lib/api-core/
├── services/booking.service.ts    ← confirmBooking, cancelBooking, createBooking
└── repositories/booking.repository.ts
```

---

## 예약 상태 흐름

```
PENDING → CONFIRMED → (COMPLETED)
                ↘
             CANCELLED
```

| 상태 | 트리거 | LINE 알림 |
|---|---|---|
| PENDING | 고객 예약 생성 | 없음 |
| CONFIRMED | 관리자 확정 (PATCH action='confirm') | BOOKING_CONFIRMED 발송 |
| CANCELLED | 관리자 취소 (PATCH action='cancel') | BOOKING_CANCELLED 발송 |

---

## 예약 확정/취소 API 패턴

```ts
// Route Handler: /api/salons/[salonId]/bookings/[bookingId]
// PATCH { action: 'confirm' | 'cancel' | 'update' }

// 서비스 레이어 호출
await bookingService.confirmBooking(bookingId);
// → DB UPDATE status='CONFIRMED'
// → DB 트리거 자동 발동 → notification_outbox INSERT
// → process-outbox Edge Function → LINE Push
```

**절대 Route Handler에서 직접 LINE API를 호출하지 않는다.**
알림은 항상 DB 트리거 → Outbox 패턴을 통해 발송된다.

---

## 하이라이트 플로우

알림 클릭 → 예약 차트로 이동 시 URL 파라미터 사용:

```
/bookings/chart?highlight={bookingId}&date={YYYY-MM-DD}&staff={staffId}
```

`BookingsPageView`가 파라미터를 읽어:
1. `setSelectedDate`, `setSelectedStaffId` 설정
2. `setHighlightedBookingId` 설정
3. URL 파라미터 제거 (`router.replace`)
4. `requestAnimationFrame` → DOM 탐색 → `scrollIntoView`
5. 5초 후 하이라이트 해제

---

## 실시간 갱신

`BookingRealtimeListener` (루트 레이아웃 마운트)가
`bookings:salon:{id}` 채널을 구독하고
변경 시 `queryClient.invalidateQueries(bookingKeys.list(salonId))` 호출.

새 컴포넌트에서 실시간 갱신이 필요하면 `bookingKeys`를 통해 캐시를 무효화한다.
별도 WebSocket 구독을 추가하지 않는다.

---

## 주의사항

- 예약 차트는 모바일(`md:hidden` 카드)과 데스크탑(`<tr>`) 두 가지 뷰가 공존한다
- 같은 `data-booking-id` 속성이 두 요소에 존재하므로 DOM 탐색 시 `offsetParent !== null` 체크 필수
- `booking_meta` JSONB 필드에 `reschedule_pending` 등 메타데이터 저장
