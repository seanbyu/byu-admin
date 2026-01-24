# Database Migrations

이 폴더는 Supabase 데이터베이스 스키마를 관리합니다.

## 파일 구조

### 기본 설정 (00-01)

- `00_extensions.sql` - PostgreSQL 확장 기능
- `01_enums.sql` - ENUM 타입 정의

### 테이블 생성 (02-10)

- `02_shops.sql` - 샵 정보
- `03_users.sql` - 사용자 (Admin + Customer 통합)
- `04_staff_positions.sql` - 직급 (살롱별 커스터마이징 가능)
- `05_staff_profiles.sql` - Staff 프로필 (권한, 일정, SNS 링크)
- `06_customer_profiles.sql` - Customer 프로필 (LINE 연동)
- `07_services.sql` - 서비스/시술 메뉴
- `08_service_position_prices.sql` - 직급별 서비스 가격
- `09_bookings.sql` - 예약
- `10_reviews.sql` - 리뷰

### 기능 및 보안 (20-36)

- `20_triggers.sql` - Triggers & Functions
- `30_rls_users.sql` - RLS: Users
- `31_rls_shops.sql` - RLS: Shops
- `32_rls_staff_positions.sql` - RLS: Staff Positions
- `33_rls_profiles.sql` - RLS: Staff & Customer Profiles
- `34_rls_services.sql` - RLS: Services & Prices
- `35_rls_bookings.sql` - RLS: Bookings
- `36_rls_reviews.sql` - RLS: Reviews

### 샘플 데이터 (99)

- `99_sample_data.sql` - 개발용 샘플 데이터 (주석 처리됨)

## 실행 방법

### 1. Supabase CLI 사용

```bash
# 모든 마이그레이션 실행
supabase db reset

# 특정 파일만 실행
psql $DATABASE_URL -f supabase/migrations/00_extensions.sql
```

### 2. Supabase Dashboard 사용

1. Supabase Dashboard → SQL Editor 접속
2. 파일 순서대로 복사 & 붙여넣기 실행

### 3. 순서대로 실행

```bash
cd supabase/migrations
for file in *.sql; do
  echo "Running $file..."
  psql $DATABASE_URL -f "$file"
done
```

## 주의사항

1. **실행 순서 중요**: 파일명의 번호 순서대로 실행해야 합니다.
2. **외래 키 의존성**: 테이블 간 참조 관계가 있으므로 순서를 지켜야 합니다.
3. **RLS 정책**: 보안을 위해 모든 테이블에 Row Level Security가 적용되어 있습니다.

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

### 승인 워크플로우

- Admin 사용자는 `is_approved=false`로 시작
- SUPER_ADMIN의 승인 필요
- Customer는 자동 승인

## 데이터 모델 예시

```
SUPER_ADMIN (플랫폼 관리자)
  └── Shop A
      ├── ADMIN (샵 오너)
      ├── Staff Positions
      │   ├── 인턴 (level 1)
      │   ├── 디자이너 (level 3)
      │   └── 스페셜 디렉터 (level 5)
      ├── Services
      │   └── 컷 (30,000원 base)
      │       ├── 인턴: 30,000원
      │       ├── 디자이너: 50,000원
      │       └── 스페셜 디렉터: 80,000원
      └── Bookings
```
