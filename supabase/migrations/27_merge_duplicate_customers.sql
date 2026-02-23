-- ============================================
-- Normalize Phone Format & Merge Duplicates
-- 전화번호 저장 형식 통일 (숫자만) + 중복 고객 병합
-- ============================================
-- 주의: 26_customer_name_history.sql 실행 후에 실행하세요

-- 0. 이전 실행에서 생성된 유니크 인덱스 제거 (재실행 안전)
DROP INDEX IF EXISTS idx_customers_phone_normalized_unique;

-- 1. 먼저 중복 고객 병합 (phone 변환 전에 실행해야 함!)
-- 런타임 정규화로 중복을 찾아서 병합
DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
  remove_id UUID;
BEGIN
  FOR dup IN
    SELECT salon_id,
           CASE
             WHEN phone LIKE '+66%' THEN '0' || regexp_replace(regexp_replace(phone, '^\+66[-\s]?', '', ''), '[^0-9]', '', 'g')
             WHEN phone LIKE '+82%' THEN '0' || regexp_replace(regexp_replace(phone, '^\+82[-\s]?', '', ''), '[^0-9]', '', 'g')
             ELSE regexp_replace(phone, '[^0-9]', '', 'g')
           END as norm_phone,
           array_agg(id ORDER BY created_at ASC) as ids,
           array_agg(name ORDER BY created_at ASC) as names
    FROM customers
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY salon_id, norm_phone
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup.ids[1];

    FOR i IN 2..array_length(dup.ids, 1) LOOP
      remove_id := dup.ids[i];

      -- 이름 변경 이력 기록
      INSERT INTO customer_name_history (customer_id, old_name, new_name, changed_by)
      VALUES (keep_id, dup.names[1], dup.names[i], 'merge_duplicate');

      -- 예약 이전
      UPDATE bookings SET customer_id = keep_id WHERE customer_id = remove_id;

      -- LINE 정보 병합
      UPDATE customers k
      SET
        user_id = COALESCE(k.user_id, r.user_id),
        line_user_id = COALESCE(k.line_user_id, r.line_user_id),
        line_display_name = COALESCE(k.line_display_name, r.line_display_name),
        line_picture_url = COALESCE(k.line_picture_url, r.line_picture_url)
      FROM customers r
      WHERE k.id = keep_id AND r.id = remove_id;

      -- 중복 고객 삭제
      DELETE FROM customers WHERE id = remove_id;

      RAISE NOTICE 'Merged customer % into % (salon: %)', remove_id, keep_id, dup.salon_id;
    END LOOP;
  END LOOP;
END $$;

-- 2. 중복 제거 후, phone 형식 변환 (국가코드 → 숫자만)
-- 태국 번호 (+66) → 0 + 나머지 숫자
UPDATE customers
SET phone = '0' || regexp_replace(regexp_replace(phone, '^\+66[-\s]?', '', ''), '[^0-9]', '', 'g')
WHERE phone LIKE '+66%';

-- 한국 번호 (+82) → 0 + 나머지 숫자
UPDATE customers
SET phone = '0' || regexp_replace(regexp_replace(phone, '^\+82[-\s]?', '', ''), '[^0-9]', '', 'g')
WHERE phone LIKE '+82%';

-- 기타 (대시만 있는 경우) → 숫자만 추출
UPDATE customers
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL AND phone != '' AND phone NOT LIKE '+%';

-- 3. phone_normalized 동기화
UPDATE customers
SET phone_normalized = regexp_replace(phone, '[^0-9+]', '', 'g')
WHERE phone IS NOT NULL AND phone != '';

-- 4. 향후 중복 방지: phone_normalized 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_normalized_unique
ON customers(salon_id, phone_normalized)
WHERE phone_normalized IS NOT NULL AND phone_normalized != '';
