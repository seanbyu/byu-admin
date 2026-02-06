# 마이그레이션 가이드

> 데이터베이스 마이그레이션 적용 방법

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
| `99_seed.sql` | 시드 데이터 |

## 로컬 개발

```bash
# Supabase 로컬 시작
npx supabase start

# DB 리셋 (모든 마이그레이션 재적용)
npx supabase db reset

# 변경사항만 적용
npx supabase db push
```

## 프로덕션

```bash
# 원격 DB에 마이그레이션 적용
npx supabase db push --db-url "postgresql://..."

# 또는 Supabase Dashboard에서 직접 실행
```

## 주의사항

1. **순서대로 실행**: 파일 번호 순서대로 실행해야 합니다
2. **ENUM 변경**: ENUM에 값 추가는 가능하지만, 삭제/수정은 마이그레이션 필요
3. **RLS 활성화**: 모든 테이블에 RLS가 활성화되어 있습니다
4. **암호화**: `salon_line_settings`의 토큰은 암호화하여 저장을 권장합니다

## 추후 확장 예정

- [ ] `notification_templates` - 알림 메시지 템플릿 (다국어)
- [ ] `coupons` - 쿠폰 시스템
- [ ] `points` - 포인트 적립/사용
- [ ] 고객 등급 자동 계산 함수 (매출/방문 기반)
- [ ] 고객 그룹 자동 분류 스케줄러 (cron job)

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| v2.5 | 2024-XX-XX | 정액권 시스템 추가 (횟수제, 기간제, 금액권, 패키지, 예약금 면제 연동) |
| v2.4 | 2024-XX-XX | 예약금 시스템 추가 (PromptPay, 결제 기록, 환불 정책) |
| v2.3 | 2024-XX-XX | 고객 확장 (생년월일, 성별, 등급, 태그, 블랙리스트, 고객 그룹, 자동 분류 규칙) |
| v2.2 | 2024-XX-XX | 리뷰 확장 (세부평점, 좋아요, 신고, 태그) |
| v2.1 | 2024-XX-XX | 알림 시스템 추가 (notifications, salon_line_settings) |
| v2.0 | 2024-XX-XX | 스키마 전면 재구성, 마케팅 메타데이터 추가 |
| v1.0 | 2024-XX-XX | 초기 버전 |
