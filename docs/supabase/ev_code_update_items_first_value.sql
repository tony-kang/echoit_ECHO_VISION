-- ============================================================================
-- ev_code 테이블의 items 배열 첫 번째 값을 "SUM_000"으로 업데이트
-- ============================================================================
-- 목적: ev_code 테이블의 items 배열의 첫 번째 요소를 "SUM_000"으로 업데이트
-- ============================================================================

-- 방법 1: items가 text[] 타입인 경우
-- items 배열의 첫 번째 요소(인덱스 1)를 "SUM_000"으로 업데이트
UPDATE public.ev_code
SET items[1] = 'SUM_000'
WHERE items IS NOT NULL 
  AND array_length(items, 1) > 0;

-- 방법 2: items가 JSONB 배열 타입인 경우 (text[]가 아닌 경우)
-- jsonb_set 함수를 사용하여 첫 번째 요소 업데이트
-- UPDATE public.ev_code
-- SET items = jsonb_set(
--     COALESCE(items, '[]'::jsonb),
--     '{0}',
--     '"SUM_000"'
-- )
-- WHERE items IS NOT NULL 
--   AND jsonb_typeof(items) = 'array'
--   AND jsonb_array_length(items) > 0;

-- 방법 3: items 배열이 비어있는 경우에도 첫 번째 요소로 추가
-- UPDATE public.ev_code
-- SET items = CASE 
--     WHEN items IS NULL OR array_length(items, 1) IS NULL THEN ARRAY['SUM_000']
--     ELSE items[1:1] || ARRAY['SUM_000'] || items[2:]
-- END;

-- 업데이트 결과 확인
SELECT 
    item_code,
    category,
    items,
    array_length(items, 1) as items_count,
    items[1] as first_item
FROM public.ev_code
WHERE items IS NOT NULL
ORDER BY item_code;
