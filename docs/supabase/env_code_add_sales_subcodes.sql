-- sales 카테고리 하위 코드 추가
-- [code] title 형태
-- value는 code 값 (숫자)
-- param의 첫 번째 항목은 title
-- parent_code는 각각 SALES_0100, SALES_0200, SALES_0400, SALES_0600, SALES_0700

-- SALES_0100 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120001', 'sales', 'SALES_0100', 1, 4120001, 'SAP/SI', ARRAY['SAP/SI'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120002', 'sales', 'SALES_0100', 2, 4120002, 'WEB/SI', ARRAY['WEB/SI'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120005', 'sales', 'SALES_0100', 3, 4120005, 'SAP/SM', ARRAY['SAP/SM'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120006', 'sales', 'SALES_0100', 4, 4120006, 'WEB/SM', ARRAY['WEB/SM'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120012', 'sales', 'SALES_0100', 5, 4120012, 'BW/SI SM', ARRAY['BW/SI SM'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120013', 'sales', 'SALES_0100', 6, 4120013, 'MDX/SI', ARRAY['MDX/SI'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4120017', 'sales', 'SALES_0100', 7, 4120017, 'BW/라이선스', ARRAY['BW/라이선스'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4140000', 'sales', 'SALES_0100', 8, 4140000, '운영권 수입', ARRAY['운영권 수입'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4150000', 'sales', 'SALES_0100', 9, 4150000, '서비스 매출', ARRAY['서비스 매출'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0200 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('4570000', 'sales', 'SALES_0200', 1, 4570000, '솔루션 매출원가', ARRAY['솔루션 매출원가'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0400 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8020001', 'sales', 'SALES_0400', 1, 8020001, '직원급여-임원', ARRAY['직원급여-임원'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8020002', 'sales', 'SALES_0400', 2, 8020002, '직원급여-직원', ARRAY['직원급여-직원'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8060000', 'sales', 'SALES_0400', 3, 8060000, '퇴직 급여', ARRAY['퇴직 급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110001', 'sales', 'SALES_0400', 4, 8110001, '복리후생비-저녁식대', ARRAY['복리후생비-저녁식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110003', 'sales', 'SALES_0400', 5, 8110003, '복리후생비-회식대', ARRAY['복리후생비-회식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110005', 'sales', 'SALES_0400', 6, 8110005, '복리후생비-건강보험', ARRAY['복리후생비-건강보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110006', 'sales', 'SALES_0400', 7, 8110006, '복리후생비-고용보험', ARRAY['복리후생비-고용보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110008', 'sales', 'SALES_0400', 8, 8110008, '복리후생비-행사비', ARRAY['복리후생비-행사비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8110099', 'sales', 'SALES_0400', 9, 8110099, '복리후생비-기타', ARRAY['복리후생비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8120001', 'sales', 'SALES_0400', 10, 8120001, '여비교통비-시내', ARRAY['여비교통비-시내'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8120002', 'sales', 'SALES_0400', 11, 8120002, '여비교통비-국내', ARRAY['여비교통비-국내'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8120006', 'sales', 'SALES_0400', 12, 8120006, '여비교통비-대리비', ARRAY['여비교통비-대리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8130000', 'sales', 'SALES_0400', 13, 8130000, '접대비', ARRAY['접대비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8140000', 'sales', 'SALES_0400', 14, 8140000, '통신비', ARRAY['통신비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8150000', 'sales', 'SALES_0400', 15, 8150000, '수도 광열비', ARRAY['수도 광열비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8160000', 'sales', 'SALES_0400', 16, 8160000, '전력비', ARRAY['전력비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8170001', 'sales', 'SALES_0400', 17, 8170001, '세금과공과금-국민연금', ARRAY['세금과공과금-국민연금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8170002', 'sales', 'SALES_0400', 18, 8170002, '세금과공과금-주민세', ARRAY['세금과공과금-주민세'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8170099', 'sales', 'SALES_0400', 19, 8170099, '세금과공과금-기타', ARRAY['세금과공과금-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8180000', 'sales', 'SALES_0400', 20, 8180000, '감가상각비', ARRAY['감가상각비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8190002', 'sales', 'SALES_0400', 21, 8190002, '지급임차료-숙소관리비', ARRAY['지급임차료-숙소관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8190003', 'sales', 'SALES_0400', 22, 8190003, '지급임차료-노트북', ARRAY['지급임차료-노트북'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8190099', 'sales', 'SALES_0400', 23, 8190099, '지급임차료-기타', ARRAY['지급임차료-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8210002', 'sales', 'SALES_0400', 24, 8210002, '보험료-산재보험', ARRAY['보험료-산재보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8220001', 'sales', 'SALES_0400', 25, 8220001, '차량유지비-유류대', ARRAY['차량유지비-유류대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8220002', 'sales', 'SALES_0400', 26, 8220002, '차량유지비-주차비', ARRAY['차량유지비-주차비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8220003', 'sales', 'SALES_0400', 27, 8220003, '차량유지비-통행료', ARRAY['차량유지비-통행료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8220007', 'sales', 'SALES_0400', 28, 8220007, '차량유지비-렌트', ARRAY['차량유지비-렌트'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8220099', 'sales', 'SALES_0400', 29, 8220099, '차량유지비-기타', ARRAY['차량유지비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8230001', 'sales', 'SALES_0400', 30, 8230001, '경상연구개발비-급여', ARRAY['경상연구개발비-급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8230003', 'sales', 'SALES_0400', 31, 8230003, '경상연구개발비-국민연금', ARRAY['경상연구개발비-국민연금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8230004', 'sales', 'SALES_0400', 32, 8230004, '경상연구개발비-건강보험', ARRAY['경상연구개발비-건강보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8230005', 'sales', 'SALES_0400', 33, 8230005, '경상연구개발비-고용보험', ARRAY['경상연구개발비-고용보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8230006', 'sales', 'SALES_0400', 34, 8230006, '경상연구개발비-산재보험', ARRAY['경상연구개발비-산재보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8230007', 'sales', 'SALES_0400', 35, 8230007, '경상연구개발비-퇴직급여', ARRAY['경상연구개발비-퇴직급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8240000', 'sales', 'SALES_0400', 36, 8240000, '운반비', ARRAY['운반비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8260001', 'sales', 'SALES_0400', 37, 8260001, '도서인쇄비-명함', ARRAY['도서인쇄비-명함'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8260002', 'sales', 'SALES_0400', 38, 8260002, '도서인쇄비-도서구입', ARRAY['도서인쇄비-도서구입'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8260099', 'sales', 'SALES_0400', 39, 8260099, '도서인쇄비-기타', ARRAY['도서인쇄비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8300099', 'sales', 'SALES_0400', 40, 8300099, '소모품비-기타', ARRAY['소모품비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8310001', 'sales', 'SALES_0400', 41, 8310001, '지급수수료-은행수수료', ARRAY['지급수수료-은행수수료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8310099', 'sales', 'SALES_0400', 42, 8310099, '지급수수료-기타', ARRAY['지급수수료-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8330000', 'sales', 'SALES_0400', 43, 8330000, '광고 선전비', ARRAY['광고 선전비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8400000', 'sales', 'SALES_0400', 44, 8400000, '무형 고정자산상각', ARRAY['무형 고정자산상각'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('8520000', 'sales', 'SALES_0400', 45, 8520000, '협회비', ARRAY['협회비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0600 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9070000', 'sales', 'SALES_0600', 1, 9070000, '외환 차익', ARRAY['외환 차익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9300000', 'sales', 'SALES_0600', 2, 9300000, '잡이익', ARRAY['잡이익'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- SALES_0700 하위 코드
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9310000', 'sales', 'SALES_0700', 1, 9310000, '이자 비용', ARRAY['이자 비용'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9320000', 'sales', 'SALES_0700', 2, 9320000, '외환 차손', ARRAY['외환 차손'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('9600000', 'sales', 'SALES_0700', 3, 9600000, '잡손실', ARRAY['잡손실'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
