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
│   ├── check-duplicate/
│   ├── invite-staff/
│   └── register-owner/
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

## 비고

- 프로젝트 루트 외에 `supabase/package.json`이 별도로 존재합니다.
- `supabase/package.json`의 `generate-types` 스크립트는 `YOUR_PROJECT_ID`를 실제 Supabase 프로젝트 ID로 변경해 사용해야 합니다.
