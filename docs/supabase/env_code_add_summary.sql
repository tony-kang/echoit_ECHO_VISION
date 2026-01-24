-- sales 및 cost 카테고리에 "계" 코드 추가
-- SALES_000: sales 카테고리, title: "계"
-- COST_000: cost 카테고리, title: "계"

-- sales 카테고리에 "계" 추가
-- value는 1 이상이어야 하는 제약조건이 있으므로 1로 설정
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_000', 'sales', NULL, 0, 1, '계', ARRAY['계'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- cost 카테고리에 "계" 추가
-- value는 1 이상이어야 하는 제약조건이 있으므로 1로 설정
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_000', 'cost', NULL, 0, 1, '계', ARRAY['계'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
