# 다중 소셜 로그인 시스템 (User Identities)

> 한 유저가 여러 소셜 계정(LINE, Google, Kakao 등)을 연결하여 어떤 것으로든 로그인 가능

## 개요

기존에는 소셜 로그인마다 별도 계정이 생성되었지만, 이제 한 유저가 여러 소셜 계정을 연동하여 동일한 계정으로 로그인할 수 있습니다.

## 구조

```
  auth.users (Supabase)         user_identities           users
  ┌────────────────────┐       ┌──────────────────┐     ┌──────────────┐
  │ id: auth-uuid-001  │──────►│ auth_id: auth-001│────►│              │
  │ provider: email    │       │ user_id: user-001│     │ id: user-001 │
  │ (LINE용 가짜이메일) │       │ provider: LINE   │     │ name: 홍길동  │
  └────────────────────┘       ├──────────────────┤     │ email: ...   │
                               │ auth_id: auth-002│     │              │
  ┌────────────────────┐       │ user_id: user-001│────►│              │
  │ id: auth-uuid-002  │──────►│ provider: GOOGLE │     └──────────────┘
  │ provider: google   │       └──────────────────┘
  └────────────────────┘              N:1
```

## user_identities 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | users.id 참조 |
| auth_id | UUID | auth.users.id (Supabase) |
| provider | ENUM | LINE/GOOGLE/KAKAO/EMAIL |
| provider_user_id | TEXT | 소셜 서비스의 유저 ID |
| profile | JSONB | 소셜에서 가져온 프로필 정보 |
| is_primary | BOOLEAN | 주 로그인 수단 여부 |
| connected_at | TIMESTAMP | 연동 시간 |
| last_used_at | TIMESTAMP | 마지막 사용 시간 |

## profile JSONB 구조

### LINE
```json
{
  "displayName": "홍길동",
  "pictureUrl": "https://profile.line-scdn.net/...",
  "statusMessage": "상태메시지"
}
```

### Google
```json
{
  "email": "hong@gmail.com",
  "name": "홍길동",
  "picture": "https://lh3.googleusercontent.com/...",
  "locale": "ko"
}
```

### Kakao
```json
{
  "nickname": "길동이",
  "profile_image": "https://k.kakaocdn.net/...",
  "email": "hong@kakao.com"
}
```

## 주요 함수

### find_or_create_user_by_identity

소셜 로그인 시 유저를 찾거나 생성합니다.

```sql
SELECT * FROM find_or_create_user_by_identity(
  p_auth_id := 'auth-uuid',
  p_provider := 'LINE',
  p_provider_user_id := 'U1234567890',
  p_profile := '{"displayName": "홍길동"}'::jsonb,
  p_email := NULL,
  p_phone := '010-1234-5678',
  p_name := '홍길동'
);

-- 반환: (user_id, is_new_user, is_new_identity)
```

**매칭 우선순위:**
1. `auth_id`로 기존 identity 검색
2. `email`로 기존 유저 검색 (자동 연동)
3. `phone`으로 기존 유저 검색 (자동 연동)
4. 모두 없으면 신규 유저 생성

### link_identity

기존 유저에 새 소셜 계정을 연동합니다.

```sql
SELECT link_identity(
  p_user_id := 'user-uuid',
  p_auth_id := 'auth-uuid',
  p_provider := 'GOOGLE',
  p_provider_user_id := 'google-123',
  p_profile := '{"email": "hong@gmail.com"}'::jsonb
);
```

### unlink_identity

소셜 계정 연동을 해제합니다. (최소 1개는 유지)

```sql
SELECT unlink_identity(
  p_user_id := 'user-uuid',
  p_provider := 'GOOGLE'
);
```

### get_user_identities

유저의 연동된 계정 목록을 조회합니다.

```sql
SELECT * FROM get_user_identities('user-uuid');

-- 반환 예시:
-- provider | provider_user_id | is_primary | connected_at
-- LINE     | U123...          | true       | 2024-01-15
-- GOOGLE   | google-456       | false      | 2024-02-20
```

## 로그인 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           로그인 흐름                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  [소셜 로그인]
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ 1. Supabase 인증 처리                    │
  │    → auth.users에서 auth_id 획득         │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ 2. find_or_create_user_by_identity()    │
  └─────────────────────────────────────────┘
       │
       ├──► [auth_id 매칭] → 기존 유저 로그인
       │
       ├──► [email 매칭] → 기존 유저 + 자동 연동
       │
       ├──► [phone 매칭] → 기존 유저 + 자동 연동
       │
       └──► [매칭 없음] → 신규 유저 생성
```

## 계정 연동 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        계정 연동 흐름                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  [LINE으로 로그인된 상태]
       │
       │  "Google 계정 연동하기" 클릭
       ▼
  ┌─────────────────────────────────────────┐
  │ 1. Google OAuth 진행                     │
  │    → 새 auth_id 획득                     │
  └─────────────────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────────────────┐
  │ 2. 이미 다른 유저에 연결된 Google인지 확인 │
  └─────────────────────────────────────────┘
       │
       ├──► [이미 연결됨] → 에러: "다른 계정에 연결된 Google입니다"
       │
       └──► [사용 가능] → link_identity() 호출
                │
                ▼
  ┌─────────────────────────────────────────┐
  │ 3. user_identities에 추가               │
  │    → 이제 LINE, Google 모두 로그인 가능   │
  └─────────────────────────────────────────┘
```

## 데이터 예시

### 홍길동: LINE + Google 연동

```
users:
┌──────────────┬─────────┬──────────────────┐
│      id      │  name   │      email       │
├──────────────┼─────────┼──────────────────┤
│ user-001     │ 홍길동   │ hong@gmail.com   │
└──────────────┴─────────┴──────────────────┘

user_identities:
┌──────────────┬──────────────┬──────────┬────────────┬────────────────────┐
│   user_id    │   auth_id    │ provider │ is_primary │ provider_user_id   │
├──────────────┼──────────────┼──────────┼────────────┼────────────────────┤
│ user-001     │ auth-001     │ LINE     │ true       │ U1234567890        │
├──────────────┼──────────────┼──────────┼────────────┼────────────────────┤
│ user-001     │ auth-002     │ GOOGLE   │ false      │ google-456         │
└──────────────┴──────────────┴──────────┴────────────┴────────────────────┘

→ 홍길동은 LINE으로도, Google로도 같은 계정으로 로그인 가능!
```
