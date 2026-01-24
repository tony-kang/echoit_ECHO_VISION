-- env_code 테이블의 title과 param에서 로마 숫자(Ⅰ, Ⅱ, Ⅲ, Ⅳ, Ⅴ, Ⅵ, Ⅶ, Ⅷ, Ⅸ, Ⅹ 등)와 점, 공백 제거
-- 예: "Ⅰ. 매출액" → "매출액", "Ⅳ. 판매 관리비" → "판매 관리비"

-- title 필드에서 로마 숫자 패턴 제거
-- 패턴: [Ⅰ-Ⅻ]\.\s* (로마 숫자 + 점 + 0개 이상의 공백)
UPDATE public.env_code
SET title = regexp_replace(title, '[Ⅰ-Ⅻ]\.\s*', '', 'g')
WHERE title ~ '[Ⅰ-Ⅻ]\.';

-- param 배열의 각 요소에서 로마 숫자 패턴 제거
UPDATE public.env_code
SET param = array(
  SELECT regexp_replace(unnest(param), '[Ⅰ-Ⅻ]\.\s*', '', 'g')
)
WHERE EXISTS (
  SELECT 1 
  FROM unnest(param) AS p 
  WHERE p ~ '[Ⅰ-Ⅻ]\.'
);

-- 업데이트 결과 확인 (선택사항)
-- SELECT code, title, param 
-- FROM public.env_code 
-- WHERE title ~ '[Ⅰ-Ⅻ]\.' OR EXISTS (
--   SELECT 1 FROM unnest(param) AS p WHERE p ~ '[Ⅰ-Ⅻ]\.'
-- );
