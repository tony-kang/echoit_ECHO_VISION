-- ============================================================================
-- sales 카테고리 이익 항목 추가 (엑셀 컬럼 매칭용)
-- ============================================================================
-- 목적: 엑셀 컬럼의 '이익' 항목과 매칭하기 위한 새로운 코드 추가
-- 특징:
--   - code : title 형태
--   - 부모 코드 없음 (parent_code = NULL)
--   - param의 첫 번째 항목은 title
-- ============================================================================

-- 매출 총 이익 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_1100', 'sales', NULL, 35, 35, '매출 총 이익', ARRAY['매출 총 이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 영업 이익 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_1200', 'sales', NULL, 36, 36, '영업 이익', ARRAY['영업 이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 법인세비용차감전순이익 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_1300', 'sales', NULL, 37, 37, '법인세비용차감전순이익', ARRAY['법인세비용차감전순이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 당기 순 이익 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_1400', 'sales', NULL, 38, 38, '당기 순 이익', ARRAY['당기 순 이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
