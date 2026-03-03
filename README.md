# Salon Store Admin

살롱 운영/관리용 어드민 웹 프로젝트입니다.  
`Next.js + TypeScript + Supabase` 기반으로 구성되어 있습니다.

## 기술 스택

- Framework: Next.js 16 (App Router), React 19
- Language: TypeScript
- Styling: Tailwind CSS
- State/Data: Zustand, TanStack Query
- Form/Validation: React Hook Form, Zod
- Backend: Supabase (DB/Auth/Edge Functions)
- i18n: next-intl (`ko`, `en`, `th`)

## 시작하기

### 요구사항

- Node.js `>= 18`
- pnpm `9.x`

### 설치 및 실행

```bash
pnpm install
pnpm dev
```

- 기본 개발 서버: `http://localhost:3000`

### 주요 명령어

```bash
pnpm dev      # 개발 서버 실행 (Turbopack)
pnpm build    # 프로덕션 빌드
pnpm start    # 프로덕션 서버 실행
pnpm lint     # ESLint 실행
pnpm format   # Prettier 포맷팅
pnpm sync:claude-skills  # skills/ -> .claude/skills 동기화
pnpm ds:check            # 디자인시스템 규칙 체크 (non-strict)
pnpm ds:check:strict     # 디자인시스템 규칙 체크 (strict, CI용)
pnpm ci:protect:ds       # main/develop 브랜치에 DS 체크를 필수 상태검사로 추가
```

`pnpm ci:protect:ds` 실행 전 준비:
- `gh auth login` 완료
- 대상 브랜치(`main`, `develop`)에 브랜치 보호가 이미 활성화되어 있어야 함
- 미리보기만 하려면: `bash scripts/configure-branch-protection.sh --dry-run`

## Claude Code Skills

- Codex용 스킬 원본은 `skills/`에 둡니다.
- Claude Code 호환본은 `.claude/skills/`에 둡니다.
- 스킬 수정 후 아래 명령으로 Claude 호환본을 갱신합니다.

```bash
pnpm sync:claude-skills
```

## 프로젝트 구조 (최상위)

```text
.
├── docs/                 # 프로젝트 문서
├── src/                  # 애플리케이션 소스
├── supabase/             # Supabase 설정/마이그레이션/함수
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

## src 구조 (핵심)

```text
src/
├── app/                  # Next.js App Router 엔트리
│   ├── [locale]/         # locale 라우팅
│   └── api/              # API route handlers
├── actions/              # 서버 액션
├── components/           # 공용/도메인 UI 컴포넌트
├── features/             # 도메인 단위 기능 모듈
│   ├── auth/
│   ├── bookings/
│   ├── chat/
│   ├── customers/
│   ├── reviews/
│   ├── salon-menus/
│   ├── salons/
│   ├── settings/
│   ├── staff/
│   └── uploads/
├── hooks/                # 공통 React hooks
├── i18n/                 # i18n 설정
├── lib/                  # API/서버/유틸 레이어
├── messages/             # 번역 리소스 (en/ko/th)
├── store/                # 전역 상태
└── types/                # 공통 타입
```

## Supabase 구조

```text
supabase/
├── functions/            # Edge Functions
│   ├── _shared/          # 공용 모듈 (CORS, LINE 템플릿)
│   ├── check-duplicate/
│   ├── enqueue-message-jobs/   # LINE Push 발송 큐 적재 (매일 실행)
│   ├── invite-staff/
│   ├── register-owner/
│   ├── send-message-jobs/      # LINE Push 발송 처리 (5분마다 실행)
│   └── track-message-event/    # 클릭/전환 이벤트 기록
├── migrations/           # DB 마이그레이션
└── src/                  # Supabase 관련 TS 코드
```

## 환경변수

아래 키들을 `.env.local`에 설정해서 사용합니다.

```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=
NEXT_PUBLIC_INSTARGRAM_ACCESS_TOKEN=
```

## LINE Push 자동화 (재예약 + 노쇼 방지 + 휴면 복귀)

### 개요

고객의 시술 완료 이력을 기반으로 자동 LINE Push 알림을 발송합니다.

| job_type | 설명 | 발송 시점 |
|---|---|---|
| `rebook_due` | 재예약 알림 | next_due_at - 3일 |
| `rebook_overdue` | 휴면 복귀 | next_due_at + 7일 ~ +21일 |
| `reminder_24h` | 예약 리마인더 | 예약 24시간 전 |
| `reminder_3h` | 예약 리마인더 | 예약 3시간 전 |

### 데이터 흐름

```
1. 예약 COMPLETED → Trigger → customer_cycles.next_due_at 자동 계산
2. enqueue-message-jobs (매일) → 대상 고객 산출 → message_jobs 적재
3. send-message-jobs (5분마다) → pending jobs → LINE Push 발송 → 상태 갱신
4. track-message-event → 클릭/전환 이벤트 기록 → 대시보드 지표
```

### 스킵 조건

- 동일 customer + job_type 14일 내 sent 이력 있으면 스킵
- rebook_* 타입: 미래 예약(PENDING/CONFIRMED)이 있으면 스킵
- opt_out=true이면 스킵
- line_user_id가 없으면 스킵
- 살롱이 비활성(is_active=false)이면 스킵

### DB 변경 (Migration: 23_line_automation.sql)

**기존 테이블 필드 추가:**
- `services.default_cycle_days` (INTEGER) - 시술 권장 재방문 주기
- `bookings.completed_at` (TIMESTAMPTZ) - 시술 완료 시각
- `customers.opt_out` (BOOLEAN) - 마케팅 수신 거부

**신규 테이블:**
- `customer_cycles` - 고객별 시술 주기 관리
- `message_jobs` - LINE Push 발송 큐
- `message_events` - 발송/클릭/전환 이벤트 로그

**뷰:**
- `v_message_job_stats` - 살롱별/타입별/일별 발송 지표

### Edge Functions

| 함수 | 스케줄 | 설명 |
|---|---|---|
| `enqueue-message-jobs` | 매일 09:00 (Asia/Bangkok) | 대상 산출 및 message_jobs 적재 |
| `send-message-jobs` | 5분마다 | pending jobs를 LINE Push로 발송 |
| `process-outbox` | 1분마다 | `notification_outbox`의 LINE 발송 + 재시도 처리 |
| `track-message-event` | On-demand | 클릭/전환 이벤트 기록 |

### 환경변수 (Edge Functions)

```bash
SUPABASE_URL=             # 자동 설정
SUPABASE_SERVICE_ROLE_KEY= # 자동 설정
BOOKING_BASE_URL=          # 예약 웹앱 URL (예: https://booking.salon.com)
```

LINE 채널 토큰은 `salon_line_settings` 테이블에 살롱별로 저장됩니다.

### 로컬 테스트

```bash
# 1. 마이그레이션 적용
supabase db reset

# 2. Edge Function 로컬 실행
supabase functions serve enqueue-message-jobs --env-file supabase/functions/.env.example
supabase functions serve send-message-jobs --env-file supabase/functions/.env.example

# 3. 테스트 시나리오
# a) 예약 상태를 COMPLETED로 변경 → customer_cycles 자동 생성 확인
# b) enqueue-message-jobs 호출 → message_jobs 생성 확인
# c) send-message-jobs 호출 → status 변경 확인 (LINE 토큰 없으면 skipped)
```

### Supabase Scheduled Triggers 설정 (프로덕션)

Supabase Dashboard > Database > Extensions에서 `pg_cron` 활성화 후:

```sql
-- enqueue: 매일 09:00 Asia/Bangkok (= 02:00 UTC)
SELECT cron.schedule(
  'enqueue-message-jobs',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/enqueue-message-jobs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );$$
);

-- send: 5분마다
SELECT cron.schedule(
  'send-message-jobs',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-message-jobs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );$$
);

-- outbox: 1분마다 (LINE 공통 발송 경로)
SELECT cron.schedule(
  'process-outbox',
  '*/1 * * * *',
  $$SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-outbox',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );$$
);
```

### 가정 사항

1. 고객의 `line_user_id`는 LINE 로그인/연동 시점에 이미 저장되어 있음
2. 살롱의 LINE 채널 설정은 `salon_line_settings` 테이블에 저장됨
3. 메시지 언어는 `salons.settings.locale`을 기본으로 사용 (없으면 영어)
4. `services.default_cycle_days`는 살롱에서 서비스별로 직접 설정 (미설정시 30일 기본값)
5. reminder 타입은 rebook과 달리 booking_id 기준으로 중복 방지

## 비고

- 프로젝트 루트 외에 `supabase/package.json`이 별도로 존재합니다.
- `supabase/package.json`의 `generate-types` 스크립트는 `YOUR_PROJECT_ID`를 실제 Supabase 프로젝트 ID로 변경해 사용해야 합니다.
