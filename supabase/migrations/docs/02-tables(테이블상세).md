# 테이블 상세

## 1. salons (살롱)

뷰티 살롱 정보를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | TEXT | 살롱명 |
| phone | TEXT | 연락처 |
| address | TEXT | 주소 |
| business_hours | JSONB | 영업시간 (요일별) |
| holidays | JSONB | 휴무일 |
| settings | JSONB | 설정 (예약, 알림 등) |
| approval_status | ENUM | 승인상태 (pending/approved/rejected) |

**settings JSONB 구조:**
```json
{
  "booking_advance_days": 30,
  "booking_cancellation_hours": 4,
  "slot_duration_minutes": 30,
  "currency": "THB",
  "timezone": "Asia/Bangkok",
  "notifications": {
    "booking_request": {
      "enabled": true,
      "channels": ["LINE", "PUSH"]
    },
    "booking_reminder": {
      "enabled": true,
      "hours_before": [24, 2]
    }
  }
}
```

---

## 2. users (사용자)

모든 로그인 가능한 사용자를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK (auth.users 참조) |
| user_type | ENUM | SALON / CUSTOMER |
| role | ENUM | SUPER_ADMIN/ADMIN/MANAGER/ARTIST/STAFF/CUSTOMER |
| email | TEXT | 이메일 |
| name | TEXT | 이름 |
| phone | TEXT | 전화번호 |
| auth_provider | ENUM | EMAIL/LINE/GOOGLE/KAKAO |
| line_profile | JSONB | LINE 프로필 정보 |
| customer_id | UUID | 연결된 고객 (FK → customers) |

**user_type 구분:**
- `SALON`: 살롱 측 사용자 (ADMIN, MANAGER, ARTIST, STAFF)
- `CUSTOMER`: LINE 로그인한 고객

---

## 3. staff_profiles (직원 프로필)

SALON 타입 사용자의 추가 정보를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | PK (FK → users) |
| salon_id | UUID | 소속 살롱 |
| position_id | UUID | 직급 |
| is_owner | BOOLEAN | 살롱 대표 여부 |
| is_booking_enabled | BOOLEAN | 예약 가능 여부 |
| permissions | JSONB | 권한 설정 |
| work_schedule | JSONB | 근무 시간 |
| holidays | JSONB | 휴가 |

**permissions JSONB 구조:**
```json
{
  "bookings": {"view": true, "create": true, "edit": true, "delete": false},
  "customers": {"view": true, "create": true, "edit": true, "delete": false},
  "services": {"view": true, "create": false, "edit": false, "delete": false},
  "staff": {"view": true, "create": false, "edit": false, "delete": false},
  "settings": {"view": false, "edit": false}
}
```

---

## 4. customers (고객)

살롱별 고객 관리 테이블입니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 소속 살롱 |
| user_id | UUID | 연결된 유저 (LINE 로그인 시) |
| name | VARCHAR | 이름 |
| phone | VARCHAR | 전화번호 |
| email | VARCHAR | 이메일 |
| customer_type | ENUM | local/foreign |
| total_visits | INTEGER | 총 방문 횟수 (자동) |
| total_spent | DECIMAL | 총 매출 (자동) |
| no_show_count | INTEGER | 노쇼 횟수 (자동) |
| last_visit | DATE | 최근 방문일 (자동) |
| primary_artist_id | UUID | 담당 아티스트 |
| acquisition_meta | JSONB | 마케팅 유입 정보 |
| line_user_id | TEXT | LINE User ID |
| birth_date | DATE | 생년월일 |
| gender | ENUM | 성별 (male/female/other/unknown) |
| occupation | TEXT | 직업 |
| tags | ENUM[] | 고객 태그 (VIP, REGULAR, NEW 등) |
| grade | ENUM | 등급 (BRONZE/SILVER/GOLD/PLATINUM/DIAMOND) |
| grade_updated_at | TIMESTAMP | 등급 업데이트 시간 |
| is_blacklisted | BOOLEAN | 블랙리스트 여부 |
| blacklist_reason | TEXT | 블랙리스트 사유 |
| blacklisted_at | TIMESTAMP | 블랙리스트 등록 시간 |
| blacklisted_by | UUID | 블랙리스트 등록한 스태프 |
| secondary_phone | VARCHAR | 보조 연락처 |
| address | TEXT | 주소 |
| notes | TEXT | 고객 요청사항 (고객 공개 가능) |
| internal_notes | TEXT | 내부 메모 (스태프만 열람) |

**acquisition_meta JSONB 구조:**
```json
{
  "utm_source": "line",
  "utm_medium": "social",
  "utm_campaign": "spring_2024",
  "referrer": "instagram",
  "registered_via": "line_login",
  "first_booking_channel": "line_liff"
}
```

**customer_tag ENUM 값:**
```
VIP           → VIP 고객
REGULAR       → 단골
NEW           → 신규
RETURNING     → 재방문
DORMANT       → 휴면 (장기 미방문)
CHURNED       → 이탈
POTENTIAL_VIP → VIP 후보
```

**customer_grade ENUM 값:**
```
BRONZE   → 기본
SILVER   → 실버
GOLD     → 골드
PLATINUM → 플래티넘
DIAMOND  → 다이아몬드
```

---

## 5. bookings (예약)

예약 정보를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| customer_id | UUID | 고객 |
| artist_id | UUID | 담당 아티스트 |
| service_id | UUID | 서비스 |
| booking_date | DATE | 예약일 |
| start_time | TIME | 시작 시간 |
| end_time | TIME | 종료 시간 |
| status | ENUM | 예약 상태 |
| payment_status | ENUM | 결제 상태 |
| total_price | DECIMAL | 총 금액 |
| confirmed_by | UUID | 확정한 스태프 |
| confirmed_at | TIMESTAMP | 확정 시간 |
| cancelled_by | UUID | 취소한 사람 |
| cancelled_at | TIMESTAMP | 취소 시간 |
| booking_meta | JSONB | 예약 채널 정보 |

**status ENUM 값:**
```
PENDING      → 예약 대기 (고객이 예약 요청)
CONFIRMED    → 예약 확정 (어드민이 확정)
IN_PROGRESS  → 시술 중
COMPLETED    → 완료
CANCELLED    → 취소됨
NO_SHOW      → 노쇼
```

**booking_meta JSONB 구조:**
```json
{
  "channel": "line_liff",
  "device": "mobile",
  "utm_source": "line",
  "coupon_code": "SUMMER20"
}
```

---

## 6. notifications (알림)

모든 알림 발송 기록을 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| salon_id | UUID | 살롱 |
| booking_id | UUID | 관련 예약 |
| recipient_type | ENUM | CUSTOMER/ADMIN/ARTIST/STAFF |
| recipient_user_id | UUID | 수신자 (관리자인 경우) |
| recipient_customer_id | UUID | 수신자 (고객인 경우) |
| notification_type | ENUM | 알림 종류 |
| channel | ENUM | LINE/EMAIL/SMS/PUSH |
| title | TEXT | 제목 |
| body | TEXT | 내용 |
| status | ENUM | PENDING/SENT/DELIVERED/READ/FAILED |
| sent_at | TIMESTAMP | 발송 시간 |
| error_message | TEXT | 실패 시 에러 |
| metadata | JSONB | 알림에 사용된 변수 |

**notification_type ENUM 값:**
```
BOOKING_REQUEST    → 예약 요청 (어드민에게)
BOOKING_CONFIRMED  → 예약 확정 (고객에게)
BOOKING_CANCELLED  → 예약 취소 (양쪽에게)
BOOKING_REMINDER   → 리마인더 (고객에게)
BOOKING_COMPLETED  → 완료 (리뷰 요청)
BOOKING_NO_SHOW    → 노쇼 (어드민에게)
BOOKING_MODIFIED   → 예약 변경 (양쪽에게)
REVIEW_RECEIVED    → 리뷰 등록 (어드민에게)
```

---

## 7. salon_line_settings (살롱 LINE 설정)

살롱별 LINE 공식계정 연동 정보를 저장합니다.

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
