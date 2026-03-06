# 고객(Customers) 도메인 에이전트

> 팀장 에이전트가 고객 관련 작업을 위임할 때 이 파일을 컨텍스트로 주입한다.
> Cline에서: `@docs/agents/customers.md` 로 참조

---

## 담당 범위

- 고객 목록 조회 / 필터 / 그룹
- 고객 상세 편집 모달 (탭별 데이터)
- 고객 차트 페이지
- LINE 연동 상태 (line_user_id, opt_out, line_blocked)

---

## 핵심 파일 맵

```
src/features/customers/
├── api.ts
├── types.ts                          ← Customer, CustomerFilter 등
├── types/filter.types.ts
├── utils/filterUtils.ts
├── hooks/
│   ├── queries.ts                    ← customerKeys
│   ├── useCustomers.ts
│   ├── useCustomerFilters.ts
│   └── useCustomerGroups.ts
├── stores/
│   └── customerStore.ts              ← 선택된 고객, 필터 UI 상태
└── views/
    └── components/
        ├── CustomerTable.tsx
        ├── EditCustomerModal/
        │   ├── EditCustomerModal.tsx
        │   ├── types.ts
        │   └── tabs/
        │       ├── SalesTabContent.tsx
        │       ├── ServiceTabContent.tsx
        │       ├── ProductTabContent.tsx
        │       ├── ReservationTabContent.tsx
        │       ├── MembershipTabContent.tsx
        │       └── CancellationFeeTabContent.tsx
        └── FilterSettingsModal/

src/app/api/salons/[salonId]/customers/
├── route.ts                          ← GET(목록), POST(생성)
└── [customerId]/
    ├── route.ts                      ← GET, PATCH, DELETE
    └── chart/route.ts                ← 고객 차트 데이터
```

---

## LINE 연동 필드

고객의 LINE 수신 여부는 3개 필드로 결정된다:

| 필드 | 의미 | 변경 주체 |
|---|---|---|
| `line_user_id` | LINE 계정 연동 여부 | LINE webhook |
| `opt_out` | 수신 거부 의사 | 고객 직접 |
| `line_blocked` | 봇 차단 여부 | LINE API 오류 감지 |

UI에서 고객 LINE 상태 표시 시 세 필드를 모두 고려한다.

---

## 고객 차트

`/customers/chart` 페이지는 특정 고객의 시술 이력을 시각화한다.
API: `GET /api/salons/[salonId]/customers/[customerId]/chart`

---

## 주의사항

- 고객 삭제 시 연관 예약 처리 방침 확인 필요 (soft delete 여부)
- `customerStore`는 UI 상태만 — 고객 데이터는 TanStack Query 캐시에서 관리
- 필터는 `filterUtils.ts`의 유틸 함수를 통해 일관성 유지
