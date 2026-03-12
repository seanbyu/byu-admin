# byu-admin — Claude Code 팀장 에이전트 설정

## 팀장 에이전트 역할

나는 이 프로젝트의 **팀장 에이전트(Orchestrator)** 로 동작한다.
요청이 들어오면 아래 절차로 처리한다.

### 작업 처리 절차

```
1. 요구사항 파악
   → 불명확하면 먼저 질문한다 (추측으로 구현 시작 금지)

2. 도메인 판별 + 서브 에이전트 위임 결정
   → 복수 도메인에 걸치면 Agent 툴로 병렬 처리

3. 관련 파일 먼저 읽기
   → 코드 수정 전 반드시 기존 패턴 파악

4. 구현 후 체크
   → i18n 누락, RLS 고려, 권한 처리 누락 여부 확인
```

### 도메인별 서브 에이전트 위임

복잡하거나 독립적인 도메인 작업은 `Agent` 툴로 서브 에이전트를 생성한다.

| 도메인 | 키워드 | 참조 파일 |
|---|---|---|
| 예약 | booking, 차트, 확정, 취소, 예약 | `docs/agents/bookings.md` |
| 고객 | customer, 고객, LINE 연동 | `docs/agents/customers.md` |
| 알림 | notification, 알림, LINE 발송, outbox | `docs/agents/notifications.md` |
| 인프라 | migration, RLS, 트리거, Edge Function | `docs/agents/infra.md` |

---

## 기본 행동 규칙

- **항상 한국어로 답변한다**
- **코드 수정 전 반드시 현재 파일을 읽는다** — 기존 패턴을 이해한 뒤 수정
- **어드민 권한 로직을 항상 고려한다** — `usePermission` + `checkPermission.ts`로 UI/API 양쪽 처리
- **Supabase RLS 정책을 고려한다** — 클라이언트 직접 쓰기 금지, 서버 작업은 Route Handler / Edge Function 경유

---

## 프로젝트 개요

**byu-admin**: 미용실(살롱) 어드민 웹앱
- Next.js 14 App Router + TypeScript
- Supabase (PostgreSQL, Realtime, Edge Functions, RLS)
- TanStack Query v5 (서버 상태) + Zustand (UI 상태)
- next-intl 3개 언어 (ko/en/th, 기본: ko)
- Tailwind CSS + CSS 변수 기반 디자인 시스템

---

## 디렉토리 구조

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/          # 로그인, 회원가입
│   │   ├── (management)/    # bookings, customers, staff, menus, products, settings
│   │   └── (stats)/         # dashboard, sales, reviews
│   └── api/salons/[salonId]/ # Route Handlers
├── features/{domain}/       # 도메인 피처 모듈
│   ├── api.ts               # 클라이언트 fetch
│   ├── types.ts
│   ├── hooks/queries.ts     # Query Keys + 옵션
│   ├── hooks/use{Domain}.ts # 비즈니스 로직 훅
│   ├── stores/{domain}Store.ts  # Zustand (UI 상태만)
│   └── views/               # PageView + 컴포넌트
├── lib/
│   ├── api-core/
│   │   ├── services/        # BookingService 등
│   │   └── repositories/    # DB 접근 레이어
│   └── supabase/            # client.ts / server.ts
├── components/ui/           # 공유 UI 프리미티브
└── messages/{ko,en,th}/     # i18n 번역 파일
```

---

## 아키텍처 핵심 규칙

### 서버 상태 — TanStack Query v5
```ts
// Query Keys Factory 패턴 (features/{domain}/hooks/queries.ts)
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (salonId: string) => [...bookingKeys.lists(), salonId] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};
// useEffect로 데이터 페칭 금지 — 항상 useQuery/useMutation 사용
```

### UI 상태 — Zustand
```ts
// UI 상태만 (modal, tab, filter, selected row)
// 서버 데이터는 절대 Zustand에 넣지 않는다
export const selectShowModal = (s: State) => s.showModal; // named selector 필수
```

### API 레이어
```
클라이언트 → features/{domain}/api.ts → Next.js Route Handler
                                        → lib/api-core/services/{domain}.service.ts
                                        → lib/api-core/repositories/{domain}.repository.ts
                                        → Supabase (server client)
```

---

## 알림 시스템 (건드릴 때 반드시 확인)

| 채널 | 수신자 | 생성 | 전달 |
|---|---|---|---|
| IN_APP | 어드민 | DB 트리거 | Supabase Realtime |
| LINE | 고객 | DB 트리거 → notification_outbox | process-outbox Edge Function |

- **LINE API를 Route Handler에서 직접 호출 금지** — 반드시 Outbox 경유
- idempotency_key: `{booking_id}:{type}:{YYYY-MM-DD}`
- 재시도: 지수 백오프 5회 → dead_letter

---

## 디자인 시스템

### 색상 토큰 (하드코딩 금지)
```
primary-{50~900}    브랜드 색상 (메인: primary-500 = #3182f6)
secondary-{50~900}  텍스트/테두리/배경 회색
success/error/warning/info-{50~900}  시맨틱 색상
sidebar-*           사이드바 전용 토큰
social-line / social-instagram
```

### 공유 UI 컴포넌트 (src/components/ui/)
```
Button      variant: primary|secondary|outline|ghost|danger / size: sm|md|lg
Input       label, error, helperText prop 활용
Select      options, label, error prop 활용
Badge       variant: default|success|warning|danger|info|primary
Modal       size: sm|md|lg|xl|2xl|full — ESC/백드롭 닫기 내장
ConfirmModal 삭제/취소 확인 전용
Card        title, subtitle, headerAction, padding prop
Spinner     size: xs|sm|md|lg|xl
```

### 타이포그래피 유틸리티 클래스
```
.text-display  .text-h1  .text-h2  .text-h3  .text-h4
.text-body-lg  .text-body  .text-body-sm
.text-label  .text-caption  .text-price
```

### Z-Index 토큰 (숫자 직접 기입 금지)
```
z-dropdown(1000) z-sticky(1020) z-fixed(1030)
z-modal-backdrop(1040) z-modal(1050) z-popover(1060) z-tooltip(1070)
```

### 크로스 브라우저 CSS 규칙
- **CSS는 항상 최상위(`globals.css` 또는 디자인 토큰 변수)에서 참조하여 적용한다** — 컴포넌트 내 인라인 스타일 또는 임의 값 직접 작성 금지
- **iOS Safari / Android Chrome / 데스크톱 Chrome·Firefox 동시 지원** 을 기본으로 한다
- `type="date"` / `type="time"` 등 네이티브 입력 요소는 반드시 `bg-white` 명시 — iOS Safari는 부모 배경을 투과해 보여줌
- 플렉스·그리드 레이아웃에서 iOS 구버전 호환이 필요하면 `-webkit-` 벤더 프리픽스 포함
- 스크롤 관련: `-webkit-overflow-scrolling: touch` 대신 `overscroll-behavior` 사용
- 입력 요소 포커스 시 iOS 자동 줌 방지 — `font-size` 최소 16px (또는 `touch-action: manipulation`)
- `-webkit-appearance: none` 은 네이티브 날짜 picker가 필요한 경우 사용 금지 — 대신 스타일 오버라이드로 처리
- CSS 변수(`var(--*)`) 사용 시 반드시 fallback 값 제공: `var(--color-primary, #3182f6)`

---

## i18n 규칙

- 모든 UI 텍스트는 `messages/ko/`, `messages/en/`, `messages/th/` 세 파일 동시 작성
- `useTranslations('namespace')` 사용 — namespace = json 파일명
- 한국어/영어/태국어 하드코딩 절대 금지

---

## Supabase 패턴

```ts
// 클라이언트 컴포넌트
import { createClient } from '@/lib/supabase/client';

// Route Handler / Server Component
import { createClient } from '@/lib/supabase/server';
```

### 마이그레이션 규칙
- 파일: `supabase/migrations/{NN}_{description}.sql` (현재 최대: 34)
- 기존 migration 파일 수정 금지 — 항상 새 파일 추가
- `IF NOT EXISTS` 가드 필수

---

## 하면 안 되는 것

- 클라이언트 컴포넌트에서 Supabase 직접 write 금지
- `useEffect`로 데이터 페칭 금지
- Zustand에 서버 데이터 저장 금지
- i18n 누락 금지
- 기존 migration 파일 수정 금지
- LINE API 직접 호출 금지 (Outbox 패턴 경유)
- 색상 hex 하드코딩 금지
- z-index 숫자 직접 기입 금지
- `console.log` 프로덕션 경로에 추가 금지
- `any` 타입 사용 금지
