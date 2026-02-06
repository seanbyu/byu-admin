# Salon Store Admin Database Schema v2.6

> 살롱 예약 관리 시스템 데이터베이스 스키마 문서

## 개요

이 데이터베이스는 미용실/네일샵 등 뷰티 살롱의 예약 관리 시스템을 위해 설계되었습니다.

### 핵심 기능
- 다중 살롱 지원 (멀티테넌트)
- **다중 소셜 로그인** (LINE, Google, Kakao 연동)
- LINE 알림 연동
- 예약 관리 및 상태 추적
- 고객 관리 및 마케팅 데이터 수집
- 직원/아티스트 관리
- 서비스 및 가격 관리
- 예약금/정액권 시스템

### 기술 스택
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **RLS**: Row Level Security 적용

---

## 문서 구조

상세 문서는 [docs/](./docs/) 폴더에서 확인할 수 있습니다.

| 문서 | 설명 |
|------|------|
| [01-erd.md](./docs/01-erd.md) | ERD (Entity Relationship Diagram) |
| [02-tables(테이블상세).md](./docs/02-tables(테이블상세).md) | 테이블 상세 (salons, users, staff, customers 등) |
| [03-booking-flow.md](./docs/03-booking-flow.md) | 예약 흐름 |
| [04-review-system.md](./docs/04-review-system.md) | 리뷰 시스템 |
| [05-customer-group.md](./docs/05-customer-group.md) | 고객 그룹 시스템 |
| [06-deposit-system.md](./docs/06-deposit-system.md) | 예약금 시스템 |
| [07-membership-system.md](./docs/07-membership-system.md) | 정액권 시스템 |
| [08-notification-system.md](./docs/08-notification-system.md) | 알림 시스템 |
| [09-line-integration.md](./docs/09-line-integration.md) | LINE 연동 |
| [10-functions.md](./docs/10-functions.md) | 주요 함수 |
| [11-rls-policies.md](./docs/11-rls-policies.md) | RLS 정책 |
| [12-triggers.md](./docs/12-triggers.md) | 트리거 및 자동 업데이트 |
| [13-migration-guide.md](./docs/13-migration-guide.md) | 마이그레이션 가이드 |
| [14-user-identities.md](./docs/14-user-identities.md) | 다중 소셜 로그인 시스템 |

---

## 마이그레이션 파일 목록

| 파일 | 설명 |
|------|------|
| `00_extensions_enums.sql` | ENUM 타입 정의 |
| `01_salons.sql` | 살롱, 업종, 이미지 |
| `02_users.sql` | 사용자 (통합) |
| `03_staff.sql` | 직원 포지션/프로필 |
| `04_customers.sql` | 고객 (LINE + 마케팅) |
| `05_services.sql` | 서비스, 카테고리, 가격 |
| `06_bookings.sql` | 예약, 리뷰 |
| `07_favorites.sql` | 즐겨찾기 |
| `08_functions.sql` | 헬퍼 함수 |
| `09_triggers.sql` | 트리거 |
| `10_rls.sql` | RLS 정책 |
| `11_storage.sql` | 스토리지 버킷 |
| `12_notifications.sql` | 알림 시스템 + LINE 설정 |
| `13_reviews_extended.sql` | 리뷰 확장 (세부평점, 좋아요, 신고) |
| `14_customers_extended.sql` | 고객 확장 (생년월일, 성별, 등급, 그룹, 블랙리스트) |
| `15_deposit_system.sql` | 예약금 시스템 (PromptPay, 결제 기록) |
| `16_membership_system.sql` | 정액권 시스템 (횟수제, 기간제, 금액권, 패키지) |
| `17_user_identities.sql` | 다중 소셜 로그인 (LINE, Google, Kakao 연동) |
| `99_seed.sql` | 시드 데이터 |

---

## 빠른 시작

### 로컬 개발

```bash
# Supabase 로컬 시작
npx supabase start

# DB 리셋 (모든 마이그레이션 재적용)
npx supabase db reset

# 변경사항만 적용
npx supabase db push
```

### 프로덕션

```bash
# 원격 DB에 마이그레이션 적용
npx supabase db push --db-url "postgresql://..."
```

자세한 내용은 [마이그레이션 가이드](./docs/13-migration-guide.md)를 참조하세요.

---

## 버전 히스토리

| 버전 | 변경사항 |
|------|----------|
| v2.6 | 다중 소셜 로그인 (user_identities 테이블, 계정 연동/해제) |
| v2.5 | 정액권 시스템 추가 |
| v2.4 | 예약금 시스템 추가 |
| v2.3 | 고객 확장 (등급, 그룹, 블랙리스트) |
| v2.2 | 리뷰 확장 (세부평점, 좋아요, 신고) |
| v2.1 | 알림 시스템 추가 |
| v2.0 | 스키마 전면 재구성 |
| v1.0 | 초기 버전 |
