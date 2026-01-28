-- ============================================================================
-- ev_excel_file 테이블에 year, month 컬럼 추가
-- ============================================================================
-- 목적: ev_excel_file 테이블에 연도(year)와 월(month) 컬럼 추가
-- ============================================================================

-- year 컬럼 추가 (INTEGER, NULL 허용)
ALTER TABLE public.ev_excel_file 
ADD COLUMN IF NOT EXISTS year INTEGER;

-- month 컬럼 추가 (INTEGER, NULL 허용, 1-12 범위)
ALTER TABLE public.ev_excel_file 
ADD COLUMN IF NOT EXISTS month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12));

-- 인덱스 생성 (year, month로 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_year_month ON public.ev_excel_file(year, month);
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_year ON public.ev_excel_file(year);
CREATE INDEX IF NOT EXISTS idx_ev_excel_file_month ON public.ev_excel_file(month);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.ev_excel_file.year IS '연도 (예: 2024)';
COMMENT ON COLUMN public.ev_excel_file.month IS '월 (1-12)';
