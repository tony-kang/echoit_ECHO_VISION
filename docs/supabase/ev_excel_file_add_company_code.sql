-- ============================================================================
-- ev_excel_file 테이블에 company_code 컬럼 추가
-- ============================================================================
-- 목적: env_code의 excel_company 카테고리 항목의 code 값 저장
-- ============================================================================

ALTER TABLE public.ev_excel_file
ADD COLUMN IF NOT EXISTS company_code TEXT;

CREATE INDEX IF NOT EXISTS idx_ev_excel_file_company_code ON public.ev_excel_file(company_code);

COMMENT ON COLUMN public.ev_excel_file.company_code IS '회사 코드 (env_code 카테고리 excel_company의 code 값)';
