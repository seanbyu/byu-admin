# 인프라(Infra) 도메인 에이전트

> 팀장 에이전트가 DB/인프라 관련 작업을 위임할 때 이 파일을 컨텍스트로 주입한다.
> Cline에서: `@docs/agents/infra.md` 로 참조

---

## 담당 범위

- Supabase 마이그레이션 작성
- RLS 정책 추가/수정
- Edge Function 개발 및 배포
- DB 트리거 / RPC 함수
- pg_cron 스케줄 관리

---

## 마이그레이션 규칙

```
supabase/migrations/{NN}_{description}.sql
```

- 파일 번호는 기존 최대값 + 1 (현재 최대: 34)
- **기존 마이그레이션 파일 절대 수정 금지** — 항상 새 파일 추가
- 모든 DDL에 `IF NOT EXISTS` / `IF EXISTS` 가드 추가
- 컬럼 추가 시: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

---

## 현재 마이그레이션 현황

| 번호 | 설명 |
|---|---|
| 12 | notifications 테이블 기본 스키마 |
| 31 | notification_outbox + DB 트리거 (예약 상태 변경) |
| 32 | notifications outbox RLS 최소권한 hardening |
| 33 | perf_logging (성능 로그) |
| 34 | booking_cancelled 관리자 알림 |

다음 마이그레이션은 `35_` 로 시작한다.

---

## 마이그레이션 파일 템플릿

```sql
-- {NN}_{description}.sql

-- 테이블 변경
ALTER TABLE public.{table_name}
  ADD COLUMN IF NOT EXISTS {column_name} {type} DEFAULT {default};

-- 새 테이블
CREATE TABLE IF NOT EXISTS public.{table_name} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- 정책
CREATE POLICY IF NOT EXISTS "{policy_name}"
  ON public.{table_name}
  FOR {ALL|SELECT|INSERT|UPDATE|DELETE}
  TO {authenticated|service_role|anon}
  USING ({condition});

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_{table}_{column}
  ON public.{table_name}({column_name});
```

---

## RLS 패턴

```sql
-- 어드민(salon 소속 사용자)만 접근
USING (
  salon_id IN (
    SELECT salon_id FROM public.salon_members
    WHERE user_id = auth.uid()
  )
)

-- service_role만 접근 (Edge Function용)
USING (auth.role() = 'service_role')

-- 본인 데이터만
USING (user_id = auth.uid())
```

---

## Edge Functions

```
supabase/functions/
├── process-outbox/index.ts    ← LINE Push 발송 (pg_cron 1분마다)
└── send-line-notifications/   ← 즉시 발송 (fire-and-forget, 현재 미사용)
```

### Edge Function 패턴

```ts
// Deno 런타임
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // service_role 사용
  )
  // ...
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## pg_cron 등록

```sql
SELECT cron.schedule(
  'process-outbox',
  '* * * * *',  -- 매 1분
  $$
  SELECT net.http_post(
    url := '{SUPABASE_URL}/functions/v1/process-outbox',
    headers := '{"Authorization":"Bearer {SERVICE_ROLE_KEY}"}'::jsonb
  )
  $$
);
```

---

## DB 트리거 패턴

```sql
-- 트리거 함수
CREATE OR REPLACE FUNCTION public.trg_{event}_fn()
RETURNS trigger AS $$
BEGIN
  -- INSERT INTO notifications ...
  -- INSERT INTO notification_outbox ...
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 등록
DROP TRIGGER IF EXISTS trg_{event} ON public.{table};
CREATE TRIGGER trg_{event}
  AFTER INSERT OR UPDATE ON public.{table}
  FOR EACH ROW EXECUTE FUNCTION public.trg_{event}_fn();
```

---

## 배포 체크리스트

```
□ supabase db push (migration 적용)
□ supabase functions deploy {function-name}
□ pg_cron 스케줄 확인: SELECT jobname, schedule FROM cron.job;
□ RLS 정책 확인: SELECT * FROM pg_policies WHERE tablename = '{table}';
```

---

## 주의사항

- Edge Function에서 반드시 `SUPABASE_SERVICE_ROLE_KEY` 사용 (anon key 금지)
- `SECURITY DEFINER` 트리거 함수는 `SET search_path = public` 명시 권장
- `notification_outbox`의 `claim_outbox_batch` RPC는 `FOR UPDATE SKIP LOCKED` 로직 — 절대 변경 금지
