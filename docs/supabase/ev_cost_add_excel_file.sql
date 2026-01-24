-- ============================================================================
-- ev_cost 테이블에 엑셀 파일 정보 컬럼 추가
-- ============================================================================

-- 엑셀 파일 ID (Storage에 저장된 파일의 경로)
ALTER TABLE public.ev_cost 
ADD COLUMN IF NOT EXISTS excel_file_id VARCHAR(255);

-- 엑셀 파일명 (원본 파일명)
ALTER TABLE public.ev_cost 
ADD COLUMN IF NOT EXISTS excel_file_name VARCHAR(255);

-- 엑셀 파일 업로드 일시
ALTER TABLE public.ev_cost 
ADD COLUMN IF NOT EXISTS excel_uploaded_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 생성 (엑셀 파일별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_ev_cost_excel_file_id ON public.ev_cost(excel_file_id);

-- 컬럼 코멘트
COMMENT ON COLUMN public.ev_cost.excel_file_id IS '엑셀 파일 ID (Storage 경로)';
COMMENT ON COLUMN public.ev_cost.excel_file_name IS '엑셀 파일명 (원본 파일명)';
COMMENT ON COLUMN public.ev_cost.excel_uploaded_at IS '엑셀 파일 업로드 일시';
