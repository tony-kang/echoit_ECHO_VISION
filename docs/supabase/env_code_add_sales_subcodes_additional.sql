-- ============================================================================
-- sales 카테고리 하위 코드 추가 (추가 요청 항목)
-- ============================================================================
-- 목적: 엑셀 칼럼 매칭을 위한 추가 env_code 항목 추가
-- 특징:
--   - [code] title 형태
--   - value는 code 값 (숫자)
--   - param의 첫 번째 항목은 title
--   - parent_code는 각각 SALES_0100, SALES_0400, SALES_0600, SALES_0700
-- ============================================================================

-- SALES_0100 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120014', 'sales', 'SALES_0100', 10, 4120014, 'HAI/SI', ARRAY['HAI/SI'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120018', 'sales', 'SALES_0100', 11, 4120018, 'HAI/라이선스', ARRAY['HAI/라이선스'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0400 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8120003', 'sales', 'SALES_0400', 12, 8120003, '여비교통비-해외', ARRAY['여비교통비-해외'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0600 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9140000', 'sales', 'SALES_0600', 3, 9140000, '유형 자산처분이익', ARRAY['유형 자산처분이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0700 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9330000', 'sales', 'SALES_0700', 4, 9330000, '기부금', ARRAY['기부금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0200 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9380000', 'sales', 'SALES_0200', 2, 9380000, '유가증권 처분손실', ARRAY['유가증권 처분손실'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0400 하위 코드 (추가)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8310003', 'sales', 'SALES_0400', 46, 8310003, '지급수수료-보증료', ARRAY['지급수수료-보증료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110007', 'sales', 'SALES_0400', 47, 8110007, '복리후생비-경조사', ARRAY['복리후생비-경조사'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0400 하위 코드 (추가)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8120004', 'sales', 'SALES_0400', 48, 8120004, '여비교통비-야근', ARRAY['여비교통비-야근'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
