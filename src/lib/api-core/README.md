# lib/api-core — Repository / Service Layer (Server-Side)

이 폴더는 **서버 사이드에서 Supabase에 직접 접근**하는 데이터 레이어입니다.

## 역할
- `repositories/` : Supabase 테이블 CRUD 직접 접근 (순수 DB 조작)
- `services/` : 비즈니스 로직 (여러 repository 조합, 복잡한 트랜잭션)
- `types.ts` : DB 스키마 타입 (DBUser, DBBooking 등) + DTO 타입

## 사용 위치
- `src/app/api/` (Next.js API Route handlers) — 주요 사용처
- `src/features/auth/api.ts` 일부
- `src/features/*/actions.ts` (Next.js Server Actions)

## 사용하지 않는 곳
- 클라이언트 컴포넌트 / hooks → `lib/api` 사용

## 관계도
```
API Route / Server Action → lib/api-core (Repository/Service) → Supabase DB
```

## 레이어 원칙
| 레이어 | 책임 |
|--------|------|
| Repository | DB 쿼리만 담당, 비즈니스 로직 없음 |
| Service | 여러 Repository 조합, 비즈니스 규칙 처리 |
| API Route | HTTP 요청/응답, 권한 확인 후 Service 호출 |
