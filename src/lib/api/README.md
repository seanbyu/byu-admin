# lib/api — HTTP REST Client Layer

이 폴더는 **클라이언트(브라우저)에서 Next.js API Routes를 호출**하는 HTTP 레이어입니다.

## 역할
- `client.ts` : fetch 기반 API 클라이언트 (JWT 자동 첨부, 토큰 갱신, 에러 처리)
- `endpoints.ts` : API 엔드포인트 경로 + React Query 키 중앙 관리
- `queries.ts` : GET 요청 React Query 훅
- `mutations.ts` : POST/PUT/DELETE React Query 훅

## 사용 위치
- `src/features/*/hooks/` 내부에서 사용
- **서버 컴포넌트나 API Route에서는 사용하지 않습니다** → 그쪽은 `lib/api-core` 사용

## 관계도
```
Browser → lib/api (HTTP fetch) → src/app/api/[route] → lib/api-core (Repository/Service)
```
