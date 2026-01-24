-- cost 카테고리 하위 코드 추가
-- [code] title 형태
-- value는 code 값 (숫자)
-- param의 첫 번째 항목은 title
-- parent_code는 각각 COST_0100, COST_0300, COST_0500

-- COST_0300 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6020001', 'cost', 'COST_0300', 1, 6020001, '외주비-인건비(법인.개인)', ARRAY['외주비-인건비(법인.개인)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6020002', 'cost', 'COST_0300', 2, 6020002, '외주비-인건비(사업)', ARRAY['외주비-인건비(사업)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6020003', 'cost', 'COST_0300', 3, 6020003, '외주비-인건비(경비)', ARRAY['외주비-인건비(경비)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- COST_0500 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110001', 'cost', 'COST_0500', 1, 6110001, '복리후생비-저녁식대', ARRAY['복리후생비-저녁식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110003', 'cost', 'COST_0500', 2, 6110003, '복리후생비-회식대', ARRAY['복리후생비-회식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110005', 'cost', 'COST_0500', 3, 6110005, '복리후생비-건강보험', ARRAY['복리후생비-건강보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110006', 'cost', 'COST_0500', 4, 6110006, '복리후생비-고용보험', ARRAY['복리후생비-고용보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110007', 'cost', 'COST_0500', 5, 6110007, '복리후생비-경조사비', ARRAY['복리후생비-경조사비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110008', 'cost', 'COST_0500', 6, 6110008, '복리후생비-행사비', ARRAY['복리후생비-행사비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110014', 'cost', 'COST_0500', 7, 6110014, '복리후생비-PJT관리비', ARRAY['복리후생비-PJT관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6110099', 'cost', 'COST_0500', 8, 6110099, '복리후생비-기타', ARRAY['복리후생비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6120001', 'cost', 'COST_0500', 9, 6120001, '여비교통비-시내', ARRAY['여비교통비-시내'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6120002', 'cost', 'COST_0500', 10, 6120002, '여비교통비-국내', ARRAY['여비교통비-국내'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6120004', 'cost', 'COST_0500', 11, 6120004, '여비교통비-야근', ARRAY['여비교통비-야근'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6120005', 'cost', 'COST_0500', 12, 6120005, '여비교통비-체재비', ARRAY['여비교통비-체재비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6120006', 'cost', 'COST_0500', 13, 6120006, '여비교통비-대리비', ARRAY['여비교통비-대리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6130000', 'cost', 'COST_0500', 14, 6130000, '접대비', ARRAY['접대비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6140000', 'cost', 'COST_0500', 15, 6140000, '통신비', ARRAY['통신비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6170001', 'cost', 'COST_0500', 16, 6170001, '세금과공과금-국민연금', ARRAY['세금과공과금-국민연금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6170002', 'cost', 'COST_0500', 17, 6170002, '세금과공과금-주민세', ARRAY['세금과공과금-주민세'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6170099', 'cost', 'COST_0500', 18, 6170099, '세금과공과금-기타', ARRAY['세금과공과금-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6180000', 'cost', 'COST_0500', 19, 6180000, '감가상각비', ARRAY['감가상각비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6190001', 'cost', 'COST_0500', 20, 6190001, '지급임차료-숙소', ARRAY['지급임차료-숙소'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6190002', 'cost', 'COST_0500', 21, 6190002, '지급임차료-숙소관리비', ARRAY['지급임차료-숙소관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6190003', 'cost', 'COST_0500', 22, 6190003, '지급임차료-노트북', ARRAY['지급임차료-노트북'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6210001', 'cost', 'COST_0500', 23, 6210001, '보험료-보증보험', ARRAY['보험료-보증보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6210002', 'cost', 'COST_0500', 24, 6210002, '보험료-산재보험', ARRAY['보험료-산재보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6220001', 'cost', 'COST_0500', 25, 6220001, '차량유지비-유류대', ARRAY['차량유지비-유류대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6220002', 'cost', 'COST_0500', 26, 6220002, '차량유지비-주차비', ARRAY['차량유지비-주차비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6220003', 'cost', 'COST_0500', 27, 6220003, '차량유지비-통행료', ARRAY['차량유지비-통행료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6220004', 'cost', 'COST_0500', 28, 6220004, '차량유지비-수선비', ARRAY['차량유지비-수선비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6220007', 'cost', 'COST_0500', 29, 6220007, '차량유지비-렌트', ARRAY['차량유지비-렌트'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6220099', 'cost', 'COST_0500', 30, 6220099, '차량유지비-기타', ARRAY['차량유지비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6230000', 'cost', 'COST_0500', 31, 6230000, '운반비', ARRAY['운반비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6250000', 'cost', 'COST_0500', 32, 6250000, '교육훈련비', ARRAY['교육훈련비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6260001', 'cost', 'COST_0500', 33, 6260001, '도서인쇄비-명함', ARRAY['도서인쇄비-명함'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6300099', 'cost', 'COST_0500', 34, 6300099, '소모품비-기타', ARRAY['소모품비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6310003', 'cost', 'COST_0500', 35, 6310003, '지급수수료-라이선스', ARRAY['지급수수료-라이선스'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('6310099', 'cost', 'COST_0500', 36, 6310099, '지급수수료-기타', ARRAY['지급수수료-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
