# RLS 정책

> Row Level Security 정책 요약

## 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| salons | 모두 (active) | - | 소속 관리자 | - |
| users | 본인 + 같은 살롱 | 관리자 | 본인 | - |
| staff_profiles | 본인 + 같은 살롱 | 관리자 | 관리자 | - |
| customers | 본인 + 소속 살롱 스태프 | 스태프 | 스태프 | 매니저+ |
| customer_groups | 살롱 스태프 | 매니저+ | 매니저+ | 매니저+ |
| customer_group_members | 살롱 스태프 | 스태프 | 스태프 | 스태프 |
| bookings | 본인 + 담당자 + 살롱 스태프 | 고객/스태프 | 스태프 | - |
| reviews | 모두 (visible) | 예약 고객 | 본인/살롱 | - |
| review_likes | 모두 | 로그인 유저 | - | 본인 |
| review_reports | 본인 + 살롱 관리자 | 로그인 유저 | 관리자 | - |
| notifications | 본인 + 살롱 스태프 | 스태프 | - | - |
| salon_line_settings | 살롱 관리자 | 관리자 | 관리자 | - |
| payments | 본인 + 살롱 스태프 | 스태프 | 매니저+ | - |
| salon_promptpay_settings | 살롱 관리자 | 관리자 | 관리자 | 관리자 |
| membership_plans | 살롱 스태프 | 매니저+ | 매니저+ | 매니저+ |
| customer_memberships | 본인 + 살롱 스태프 | 스태프 | 스태프 | 매니저+ |
| membership_usages | 살롱 스태프 | 스태프 | 스태프 | - |

## 역할 계층

```
SUPER_ADMIN > ADMIN > MANAGER > ARTIST/STAFF > CUSTOMER
```

## 권한 설명

| 표기 | 설명 |
|------|------|
| 모두 | 모든 사용자 (로그인 불필요) |
| 본인 | 해당 레코드의 소유자 |
| 스태프 | ARTIST, STAFF 이상 역할 |
| 매니저+ | MANAGER 이상 역할 |
| 관리자 | ADMIN 이상 역할 |
| 살롱 스태프 | 같은 살롱에 소속된 스태프 |
