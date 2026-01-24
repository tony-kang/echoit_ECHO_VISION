-- cost 카테고리 항목 추가
-- title - code, parent_code 형태
-- value는 1부터 순차적으로
-- param는 title을 첫 번째 항목으로

-- 원재료비 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0100', 'cost', NULL, 1, 1, '원재료비', ARRAY['원재료비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 노무비 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0200', 'cost', NULL, 2, 2, '노무비', ARRAY['노무비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 급여-임원
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0201', 'cost', 'COST_0200', 3, 3, '급여-임원', ARRAY['급여-임원'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 급여-직원(RPA)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0202', 'cost', 'COST_0200', 4, 4, '급여-직원(RPA)', ARRAY['급여-직원(RPA)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 급여-직원(EMS)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0203', 'cost', 'COST_0200', 5, 5, '급여-직원(EMS)', ARRAY['급여-직원(EMS)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 급여-지원금
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0204', 'cost', 'COST_0200', 6, 6, '급여-지원금', ARRAY['급여-지원금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 퇴직급여
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0205', 'cost', 'COST_0200', 7, 7, '퇴직급여', ARRAY['퇴직급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 직원급여
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0206', 'cost', 'COST_0200', 7, 7, '직원급여', ARRAY['직원급여'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 상여금-임원
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0207', 'cost', 'COST_0200', 7, 7, '상여금-임원', ARRAY['상여금-임원'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 상여금-임원
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0208', 'cost', 'COST_0200', 7, 7, '상여금-직원', ARRAY['상여금-직원'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;


-- 외주비 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0300', 'cost', NULL, 8, 8, '외주비', ARRAY['외주비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 외주비-인건비(법인,개인)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0301', 'cost', 'COST_0300', 9, 9, '외주비-인건비(법인,개인)', ARRAY['외주비-인건비(법인,개인)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 외주비-인건비(사업)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0302', 'cost', 'COST_0300', 10, 10, '외주비-인건비(사업)', ARRAY['외주비-인건비(사업)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 중기 및 운반비 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0400', 'cost', NULL, 11, 11, '중기 및 운반비', ARRAY['중기 및 운반비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 경비 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0500', 'cost', NULL, 12, 12, '경비', ARRAY['경비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-저녁식대
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0501', 'cost', 'COST_0500', 13, 13, '복리후생비-저녁식대', ARRAY['복리후생비-저녁식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-휴일식대
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0502', 'cost', 'COST_0500', 14, 14, '복리후생비-휴일식대', ARRAY['복리후생비-휴일식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-회식대
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0503', 'cost', 'COST_0500', 15, 15, '복리후생비-회식대', ARRAY['복리후생비-회식대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-건강보험
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0504', 'cost', 'COST_0500', 16, 16, '복리후생비-건강보험', ARRAY['복리후생비-건강보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-고용보험
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0505', 'cost', 'COST_0500', 17, 17, '복리후생비-고용보험', ARRAY['복리후생비-고용보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-경조사비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0506', 'cost', 'COST_0500', 18, 18, '복리후생비-경조사비', ARRAY['복리후생비-경조사비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-행사비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0507', 'cost', 'COST_0500', 19, 19, '복리후생비-행사비', ARRAY['복리후생비-행사비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-PJT관리비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0508', 'cost', 'COST_0500', 20, 20, '복리후생비-PJT관리비', ARRAY['복리후생비-PJT관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 복리후생비-기타
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0509', 'cost', 'COST_0500', 21, 21, '복리후생비-기타', ARRAY['복리후생비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 여비교통비-시내
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0510', 'cost', 'COST_0500', 22, 22, '여비교통비-시내', ARRAY['여비교통비-시내'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 여비교통비-국내
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0511', 'cost', 'COST_0500', 23, 23, '여비교통비-국내', ARRAY['여비교통비-국내'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 여비교통비-야근
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0512', 'cost', 'COST_0500', 24, 24, '여비교통비-야근', ARRAY['여비교통비-야근'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 여비교통비-체재비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0513', 'cost', 'COST_0500', 25, 25, '여비교통비-체재비', ARRAY['여비교통비-체재비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 여비교통비-대리비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0514', 'cost', 'COST_0500', 26, 26, '여비교통비-대리비', ARRAY['여비교통비-대리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 접대비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0515', 'cost', 'COST_0500', 27, 27, '접대비', ARRAY['접대비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 통신비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0516', 'cost', 'COST_0500', 28, 28, '통신비', ARRAY['통신비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 세금과공과금-국민연금
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0517', 'cost', 'COST_0500', 29, 29, '세금과공과금-국민연금', ARRAY['세금과공과금-국민연금'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 세금과공과금-주민세
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0518', 'cost', 'COST_0500', 30, 30, '세금과공과금-주민세', ARRAY['세금과공과금-주민세'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 감가상각비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0519', 'cost', 'COST_0500', 31, 31, '감가상각비', ARRAY['감가상각비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급임차료-숙소
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0520', 'cost', 'COST_0500', 32, 32, '지급임차료-숙소', ARRAY['지급임차료-숙소'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급임차료-숙소관리비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0521', 'cost', 'COST_0500', 33, 33, '지급임차료-숙소관리비', ARRAY['지급임차료-숙소관리비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급임차료-노트북
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0522', 'cost', 'COST_0500', 34, 34, '지급임차료-노트북', ARRAY['지급임차료-노트북'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 보험료-보증보험
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0523', 'cost', 'COST_0500', 35, 35, '보험료-보증보험', ARRAY['보험료-보증보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 보험료-산재보험
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0524', 'cost', 'COST_0500', 36, 36, '보험료-산재보험', ARRAY['보험료-산재보험'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 차량유지비-유류대
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0525', 'cost', 'COST_0500', 37, 37, '차량유지비-유류대', ARRAY['차량유지비-유류대'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 차량유지비-주차비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0526', 'cost', 'COST_0500', 38, 38, '차량유지비-주차비', ARRAY['차량유지비-주차비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 차량유지비-통행료
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0527', 'cost', 'COST_0500', 39, 39, '차량유지비-통행료', ARRAY['차량유지비-통행료'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 차량유지비-렌트
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0528', 'cost', 'COST_0500', 40, 40, '차량유지비-렌트', ARRAY['차량유지비-렌트'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 운반비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0529', 'cost', 'COST_0500', 41, 41, '운반비', ARRAY['운반비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 교육훈련비
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0530', 'cost', 'COST_0500', 42, 42, '교육훈련비', ARRAY['교육훈련비'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 도서인쇄비-명함
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0531', 'cost', 'COST_0500', 43, 43, '도서인쇄비-명함', ARRAY['도서인쇄비-명함'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 소모품비-기타
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0532', 'cost', 'COST_0500', 44, 44, '소모품비-기타', ARRAY['소모품비-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급수수료-라이선스(RPA)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0533', 'cost', 'COST_0500', 45, 45, '지급수수료-라이선스(RPA)', ARRAY['지급수수료-라이선스(RPA)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급수수료-라이선스(EMS)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0534', 'cost', 'COST_0500', 46, 46, '지급수수료-라이선스(EMS)', ARRAY['지급수수료-라이선스(EMS)'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 지급수수료-기타
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0535', 'cost', 'COST_0500', 47, 47, '지급수수료-기타', ARRAY['지급수수료-기타'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 당기 총 공사비용 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0600', 'cost', NULL, 48, 48, '당기 총 공사비용', ARRAY['당기 총 공사비용'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 공사손실충당금전입 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0700', 'cost', NULL, 49, 49, '공사손실충당금전입', ARRAY['공사손실충당금전입'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 공사손실충당금환입 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0800', 'cost', NULL, 50, 50, '공사손실충당금환입', ARRAY['공사손실충당금환입'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- Ⅸ. 기초 미완성 공사액 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_0900', 'cost', NULL, 51, 51, 'Ⅸ. 기초 미완성 공사액', ARRAY['Ⅸ. 기초 미완성 공사액'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 타계정에서 대체액 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_1000', 'cost', NULL, 52, 52, '타계정에서 대체액', ARRAY['타계정에서 대체액'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 합계 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_1100', 'cost', NULL, 53, 53, '합계', ARRAY['합계'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 기말 미완성 공사액 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_1200', 'cost', NULL, 54, 54, '기말 미완성 공사액', ARRAY['기말 미완성 공사액'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 타계정으로 대체액 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_1300', 'cost', NULL, 55, 55, '타계정으로 대체액', ARRAY['타계정으로 대체액'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;

-- 당기 공사 원가 (최상위)
INSERT INTO public.env_code (code, category, parent_code, "order", value, title, param)
VALUES ('COST_1400', 'cost', NULL, 56, 56, '당기 공사 원가', ARRAY['당기 공사 원가'])
ON CONFLICT (code) DO UPDATE SET
  category = EXCLUDED.category,
  parent_code = EXCLUDED.parent_code,
  "order" = EXCLUDED."order",
  value = EXCLUDED.value,
  title = EXCLUDED.title,
  param = EXCLUDED.param;
