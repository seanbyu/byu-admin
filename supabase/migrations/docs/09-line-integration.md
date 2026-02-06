# LINE 연동

> LINE 로그인 및 메시징 연동 시스템

## 구조

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   LINE Login    │      │   LINE LIFF     │      │ LINE Messaging  │
│   (인증)         │      │   (예약 웹앱)    │      │ API (알림 발송)  │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                        salon_line_settings                         │
│  - line_channel_id                                                 │
│  - line_channel_secret                                             │
│  - line_channel_access_token                                       │
│  - liff_id                                                         │
└────────────────────────────────────────────────────────────────────┘
```

## salon_line_settings 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 (UNIQUE) |
| line_channel_id | TEXT | LINE Channel ID |
| line_channel_secret | TEXT | Channel Secret (암호화) |
| line_channel_access_token | TEXT | Access Token (암호화) |
| liff_id | TEXT | LIFF App ID |
| is_active | BOOLEAN | 활성화 여부 |
| is_verified | BOOLEAN | 연동 검증 완료 여부 |

## LINE 로그인 → 고객 매칭 흐름

```
1. 고객이 LINE으로 로그인
         │
         ▼
2. users 테이블에 레코드 생성
   - user_type: 'CUSTOMER'
   - auth_provider: 'LINE'
   - line_profile: {...}
         │
         ▼
3. link_line_user_to_customer() 함수 호출
   - 전화번호로 기존 customers 검색
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 [있음]     [없음]
    │         │
    ▼         ▼
 연결       새 customers 생성
    │         │
    └────┬────┘
         │
         ▼
4. 양방향 연결 완료
   - customers.user_id = users.id
   - users.customer_id = customers.id
```

## users 테이블 LINE 관련 필드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| auth_provider | ENUM | EMAIL/LINE/GOOGLE/KAKAO |
| provider_user_id | TEXT | LINE User ID |
| line_profile | JSONB | LINE 프로필 정보 |
| customer_id | UUID | 연결된 고객 |

## line_profile JSONB 구조

```json
{
  "displayName": "홍길동",
  "pictureUrl": "https://...",
  "statusMessage": "..."
}
```

## 고객 매칭 함수

| 함수 | 설명 |
|------|------|
| `find_customer_by_phone(salon_id, phone)` | 전화번호로 고객 찾기 |
| `link_line_user_to_customer(user_id, salon_id, phone, name, meta)` | LINE 유저-고객 연결 |
