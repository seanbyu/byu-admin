# 트리거 및 자동 업데이트

> 자동으로 업데이트되는 필드 및 트리거 목록

## 자동 업데이트 필드

| 테이블 | 필드 | 업데이트 시점 |
|--------|------|--------------|
| customers | total_visits | 예약 완료 시 |
| customers | last_visit | 예약 완료 시 |
| customers | total_spent | 결제 완료 시 |
| customers | no_show_count | 노쇼 상태 변경 시 |
| customers | grade_updated_at | 등급 변경 시 |
| reviews | likes_count | 좋아요 추가/삭제 시 |
| reviews | report_count | 신고 접수 시 |
| reviews | is_reported | 신고 접수 시 (true) |
| customer_groups | last_auto_assigned_at | 자동 분류 실행 시 |
| customer_memberships | remaining_count | 정액권 사용/취소 시 |
| customer_memberships | remaining_amount | 금액권 사용/취소 시 |
| customer_memberships | bundle_remaining | 패키지 사용/취소 시 |
| customer_memberships | status | 소진/만료 시 자동 변경 |
| 모든 테이블 | updated_at | 업데이트 시 |

## 주요 트리거

### updated_at 자동 업데이트

모든 테이블에 `update_updated_at()` 트리거가 적용되어 있습니다.

```sql
CREATE TRIGGER update_[table]_updated_at
BEFORE UPDATE ON [table]
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 노쇼 시 예약금 자동 몰수

```sql
CREATE TRIGGER trg_forfeit_deposit_on_no_show
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION forfeit_deposit_on_no_show();
```

- 예약 상태가 `NO_SHOW`로 변경되고 예약금이 `PAID` 상태인 경우
- 예약금 상태를 `FORFEITED`로 자동 변경
- `deposit_forfeited_at` 시간 기록
