-- sales 카테고리 항목 추가
-- title - code, parent_code 형태
-- value는 1부터 순차적으로
-- param는 title을 첫 번째 항목으로

-- Ⅰ. 매출액 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0100', 'sales', NULL, 1, 1, 'Ⅰ. 매출액', ARRAY['Ⅰ. 매출액'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 임대료 수입
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0101', 'sales', 'SALES_0100', 2, 2, '임대료 수입', ARRAY['임대료 수입'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 프로그램개발매출
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0102', 'sales', 'SALES_0100', 3, 3, '프로그램개발매출', ARRAY['프로그램개발매출'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅱ. 매출 원가 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0200', 'sales', NULL, 4, 4, 'Ⅱ. 매출 원가', ARRAY['Ⅱ. 매출 원가'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 도급공사 매출원가
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0201', 'sales', 'SALES_0200', 5, 5, '도급공사 매출원가', ARRAY['도급공사 매출원가'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅲ. 매출 총 손실 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0300', 'sales', NULL, 6, 6, 'Ⅲ. 매출 총 손실', ARRAY['Ⅲ. 매출 총 손실'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅳ. 판매 관리비 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0400', 'sales', NULL, 7, 7, 'Ⅳ. 판매 관리비', ARRAY['Ⅳ. 판매 관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 직원급여
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0401', 'sales', 'SALES_0400', 8, 8, '직원급여', ARRAY['직원급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 퇴직 급여
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0402', 'sales', 'SALES_0400', 9, 9, '퇴직 급여', ARRAY['퇴직 급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0403', 'sales', 'SALES_0400', 10, 10, '복리후생비', ARRAY['복리후생비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 여비교통비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0404', 'sales', 'SALES_0400', 11, 11, '여비교통비', ARRAY['여비교통비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 접대비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0405', 'sales', 'SALES_0400', 12, 12, '접대비', ARRAY['접대비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 통신비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0406', 'sales', 'SALES_0400', 13, 13, '통신비', ARRAY['통신비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 전력비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0407', 'sales', 'SALES_0400', 14, 14, '전력비', ARRAY['전력비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 세금과공과금
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0408', 'sales', 'SALES_0400', 15, 15, '세금과공과금', ARRAY['세금과공과금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 감가상각비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0409', 'sales', 'SALES_0400', 16, 16, '감가상각비', ARRAY['감가상각비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급임차료
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0410', 'sales', 'SALES_0400', 17, 17, '지급임차료', ARRAY['지급임차료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 수선비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0411', 'sales', 'SALES_0400', 18, 18, '수선비', ARRAY['수선비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 보험료
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0412', 'sales', 'SALES_0400', 19, 19, '보험료', ARRAY['보험료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 차량유지비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0413', 'sales', 'SALES_0400', 20, 20, '차량유지비', ARRAY['차량유지비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 소모품비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0414', 'sales', 'SALES_0400', 21, 21, '소모품비', ARRAY['소모품비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급수수료
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0415', 'sales', 'SALES_0400', 22, 22, '지급수수료', ARRAY['지급수수료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 광고 선전비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0416', 'sales', 'SALES_0400', 23, 23, '광고 선전비', ARRAY['광고 선전비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 건물 관리비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0417', 'sales', 'SALES_0400', 24, 24, '건물 관리비', ARRAY['건물 관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅴ. 영업 손실 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0500', 'sales', NULL, 25, 25, 'Ⅴ. 영업 손실', ARRAY['Ⅴ. 영업 손실'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅵ. 영업 외 수익 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0600', 'sales', NULL, 26, 26, 'Ⅵ. 영업 외 수익', ARRAY['Ⅵ. 영업 외 수익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 이자 수익
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0601', 'sales', 'SALES_0600', 27, 27, '이자 수익', ARRAY['이자 수익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 외환 차익
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0602', 'sales', 'SALES_0600', 28, 28, '외환 차익', ARRAY['외환 차익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 잡이익
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0603', 'sales', 'SALES_0600', 29, 29, '잡이익', ARRAY['잡이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅶ. 영업 외 비용 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0700', 'sales', NULL, 30, 30, 'Ⅶ. 영업 외 비용', ARRAY['Ⅶ. 영업 외 비용'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 이자 비용
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0701', 'sales', 'SALES_0700', 31, 31, '이자 비용', ARRAY['이자 비용'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅷ. 법인세비용차감전순손실 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0800', 'sales', NULL, 32, 32, 'Ⅷ. 법인세비용차감전순손실', ARRAY['Ⅷ. 법인세비용차감전순손실'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅸ. 법인세 비용 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_0900', 'sales', NULL, 33, 33, 'Ⅸ. 법인세 비용', ARRAY['Ⅸ. 법인세 비용'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅹ. 당기 순 손실 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('SALES_1000', 'sales', NULL, 34, 34, 'Ⅹ. 당기 순 손실', ARRAY['Ⅹ. 당기 순 손실'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
