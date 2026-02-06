# 리뷰 시스템

> 예약 완료 후 고객이 작성하는 리뷰 관리 시스템

## reviews (리뷰) 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| booking_id | UUID | 예약 (1:1) |
| salon_id | UUID | 살롱 |
| customer_id | UUID | 작성 고객 |
| artist_id | UUID | 담당 아티스트 |
| rating | INTEGER | 종합 별점 (1-5) |
| service_rating | INTEGER | 서비스 만족도 (1-5) |
| staff_rating | INTEGER | 직원 친절도 (1-5) |
| cleanliness_rating | INTEGER | 청결도 (1-5) |
| value_rating | INTEGER | 가격 대비 만족도 (1-5) |
| comment | TEXT | 리뷰 내용 |
| tags | TEXT[] | 태그 (["친절해요", "기술이좋아요"]) |
| images | TEXT[] | 이미지 URL 배열 |
| likes_count | INTEGER | 좋아요 수 (자동) |
| response | TEXT | 살롱 답변 |
| response_by | UUID | 답변 작성자 |
| responded_at | TIMESTAMP | 답변 시간 |
| is_reported | BOOLEAN | 신고됨 여부 |
| report_count | INTEGER | 신고 횟수 (자동) |
| is_edited | BOOLEAN | 수정됨 여부 |
| edited_at | TIMESTAMP | 수정 시간 |
| is_visible | BOOLEAN | 노출 여부 |

## review_likes (리뷰 좋아요) 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| review_id | UUID | 리뷰 |
| user_id | UUID | 좋아요 누른 사용자 |
| created_at | TIMESTAMP | 생성 시간 |

## review_reports (리뷰 신고) 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| review_id | UUID | 신고된 리뷰 |
| reported_by | UUID | 신고자 |
| reason | TEXT | 신고 사유 |
| reason_detail | TEXT | 상세 사유 |
| status | ENUM | PENDING/REVIEWING/RESOLVED/DISMISSED |
| resolved_by | UUID | 처리자 |
| resolved_at | TIMESTAMP | 처리 시간 |
| resolution_note | TEXT | 처리 내용 |

## 신고 사유 예시

- 욕설/비방
- 허위 리뷰
- 광고성 내용
- 개인정보 노출
- 기타

## 리뷰 태그 예시

```json
["친절해요", "기술이좋아요", "분위기좋아요", "가격이합리적", "청결해요", "재방문의사있음"]
```

## 리뷰 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              리뷰 흐름                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  [고객]                           [시스템]                         [어드민]
    │                                │                                │
    │  1. 예약 완료 후 리뷰 작성      │                                │
    │  ──────────────────────────►   │                                │
    │  (rating, comment, tags,       │                                │
    │   세부평점, images)            │                                │
    │                                │                                │
    │                                │  reviews 생성                   │
    │                                │                                │
    │                                │  2. 알림 발송 ─────────────────►│
    │                                │  (REVIEW_RECEIVED)             │
    │                                │                                │
    │                                │                   3. 답변 작성  │
    │                                │  ◄─────────────────────────────│
    │                                │  (response)                    │
    │                                │                                │
    │  4. 다른 고객이 좋아요 클릭     │                                │
    │  ──────────────────────────►   │                                │
    │                                │  review_likes 생성              │
    │                                │  likes_count 자동 증가          │
    │                                │                                │
    │  5. 부적절한 리뷰 신고         │                                │
    │  ──────────────────────────►   │                                │
    │                                │  review_reports 생성            │
    │                                │  is_reported = true            │
    │                                │                                │
    │                                │                   6. 신고 처리  │
    │                                │  ◄─────────────────────────────│
    │                                │  (status: RESOLVED)           │
    │                                │                                │
    └────────────────────────────────┴────────────────────────────────┘
```
