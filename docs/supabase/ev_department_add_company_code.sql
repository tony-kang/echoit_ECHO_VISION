-- ============================================================================
-- ev_department 테이블에 company_code 컬럼 추가 (TEXT 배열)
-- ============================================================================
-- 목적: 부서별 회사 코드 목록 (env_code excel_company 등)
-- ============================================================================

ALTER TABLE public.ev_department
ADD COLUMN IF NOT EXISTS company_code TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.ev_department.company_code IS '회사 코드 배열 (env_code excel_company 등)';
