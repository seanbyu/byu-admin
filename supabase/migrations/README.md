# Database Migrations

이 폴더는 Supabase 데이터베이스 스키마를 관리합니다.

## 파일 구조

```
00_extensions.sql      # PostgreSQL 확장 기능
01_enums.sql          # ENUM 타입 정의 (user_type, user_role, approval_status_type 등)
02_salons.sql         # 살롱 관련 테이블 (salons, industries, salon_industries, salon_images)
03_users.sql          # 사용자 테이블
04_profiles.sql       # 프로필 테이블 (staff_positions, staff_profiles, customer_profiles)
05_services.sql       # 서비스 관련 테이블 (service_categories, services, service_position_prices)
06_bookings.sql       # 예약 관련 테이블 (bookings, reviews)
10_functions.sql      # 헬퍼 함수 (update_updated_at, get_my_role 등)
11_triggers.sql       # 트리거 (updated_at, auth user 생성 등)
20_rls.sql            # Row Level Security 정책
30_storage.sql        # Storage 버킷 및 정책
40_seed.sql           # 시드 데이터 (industries)
```

## 실행 방법

```bash
# 로컬 개발 - DB 리셋
npx supabase db reset

# 프로덕션 배포
npx supabase db push
```

## 승인 구조

### 살롱 승인 (Salon Approval)
- **플랫폼 관리자가 살롱을 승인/거절**
- `salons.approval_status`: `'pending'` | `'approved'` | `'rejected'`
- 로그인 시 ADMIN/MANAGER 역할의 유저는 살롱 승인 상태를 체크
- `'pending'` 상태에서는 로그인 불가

### 사용자 승인 (User Approval)
- `users.is_approved`: **기본값 `true`**
- 개별 사용자 승인은 사용하지 않음 (살롱 승인으로 통합)

## 역할 (Roles)

| 역할 | 설명 | salon_id |
|------|------|----------|
| `SUPER_ADMIN` | 플랫폼 관리자 (모든 살롱 관리) | NULL |
| `ADMIN` | 살롱 오너 (회원가입 시 기본) | 필수 |
| `MANAGER` | 살롱 매니저 | 필수 |
| `STAFF` | 일반 직원 | 필수 |
| `CUSTOMER` | 고객 | NULL |

## 로그인 플로우

```
Supabase Auth 인증
       │
       ▼
users 테이블 조회
       │
       ▼
role = ADMIN 또는 MANAGER?
       │
   YES │ NO
       │  └──────────────────┐
       ▼                     ▼
salons.approval_status    로그인 성공
체크
       │
┌──────┼──────┐
│      │      │
▼      ▼      ▼
pending approved rejected
│      │      │
▼      ▼      ▼
에러   성공    에러
```

## Edge Functions

회원가입 로직은 Edge Function에서 처리됩니다.

```bash
npx supabase functions deploy register-owner
npx supabase functions deploy invite-staff
npx supabase functions deploy check-duplicate
```

## 스키마 특징

### Single Table with Discriminator
- `users` 테이블에 Admin과 Customer를 통합
- `user_type` 컬럼으로 구분 ('ADMIN_USER' | 'CUSTOMER')

### 커스터마이징 가능한 직급 시스템
- `staff_positions` 테이블로 살롱별 직급 관리
- 직급별 서비스 가격 차등 적용 가능

### Multi-Provider 인증
- Email/Password, LINE, Google, Kakao 지원
- `auth_provider` 및 `provider_user_id` 컬럼

## 데이터 모델

```
SUPER_ADMIN (플랫폼 관리자)
  └── Salon A (approval_status: 'approved')
      ├── ADMIN (샵 오너, is_approved: true)
      ├── Staff Positions
      │   ├── 인턴 (level 1)
      │   ├── 디자이너 (level 3)
      │   └── 스페셜 디렉터 (level 5)
      ├── Services
      │   └── 컷 (pricing_type: POSITION_BASED)
      │       ├── 인턴: 30,000원
      │       ├── 디자이너: 50,000원
      │       └── 스페셜 디렉터: 80,000원
      └── Bookings
          └── Customer → Designer → Service
```
