-- ============================================================================
-- 매출 테이블 구조 변경 (ev_sales)
-- ============================================================================
-- 목적: 엑셀 파일마다 컬럼이 다르므로 고정 컬럼 구조를 JSONB로 변경
-- 변경 사항:
--   - 고정 컬럼만 유지: id, year, month, notes, created_at, updated_at, excel_file_id, sales_code
--   - 나머지 모든 컬럼 삭제
--   - excel_file_data JSONB 추가 (sales_code별 엑셀 데이터 저장)
-- ============================================================================

-- 기존 테이블 백업 (선택사항)
-- CREATE TABLE public.ev_sales_backup AS SELECT * FROM public.ev_sales;

-- 기존 제약조건 및 인덱스 삭제
ALTER TABLE IF EXISTS public.ev_sales DROP CONSTRAINT IF EXISTS fk_ev_sales_code CASCADE;
ALTER TABLE IF EXISTS public.ev_sales DROP CONSTRAINT IF EXISTS unique_year_month_code CASCADE;
DROP INDEX IF EXISTS idx_ev_sales_code;
DROP INDEX IF EXISTS idx_ev_sales_year;
DROP INDEX IF EXISTS idx_ev_sales_year_month;
DROP INDEX IF EXISTS idx_ev_sales_code_year_month;

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_ev_sales_updated_at ON public.ev_sales;

-- 기존 테이블 삭제 및 재생성
DROP TABLE IF EXISTS public.ev_sales CASCADE;

CREATE TABLE public.ev_sales (
    -- 고유 ID (Primary Key)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 연도
    -- 매출 데이터의 연도 (예: 2024)
    year INTEGER NOT NULL,
    
    -- 월
    -- 매출 데이터의 월 (1~12, NULL이면 연간 합계)
    month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
    
    -- 메모/비고
    -- 추가 설명 또는 비고 사항
    notes TEXT,
    
    -- 생성일시
    -- 레코드가 생성된 시간 (자동 설정)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 수정일시
    -- 레코드가 마지막으로 수정된 시간 (트리거로 자동 갱신)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 엑셀 파일 ID (ev_excel_file 참조)
    -- 데이터가 추출된 엑셀 파일
    excel_file_id UUID REFERENCES public.ev_excel_file(id) ON DELETE CASCADE,
    
    -- 매출 코드 (env_code 참조)
    -- 매출 데이터가 속한 환경설정 코드
    sales_code VARCHAR(16) NOT NULL,
    
    -- 엑셀 파일 데이터 (JSONB)
    -- sales_code에 매칭된 엑셀의 모든 컬럼 데이터를 JSON 형태로 저장
    -- 예: {"컬럼명1": "값1", "컬럼명2": "값2", ...}
    excel_file_data JSONB DEFAULT '{}'::jsonb,
    
    -- 환경설정 코드 외래키 제약조건
    CONSTRAINT fk_ev_sales_sales_code 
        FOREIGN KEY (sales_code) 
        REFERENCES public.env_code(code) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- 연도, 월, 엑셀 파일 ID, 매출 코드의 고유성 제약
-- (동일 연도/월/엑셀파일/코드에 중복 데이터 방지)
ALTER TABLE public.ev_sales 
    ADD CONSTRAINT unique_year_month_excel_file_sales_code 
    UNIQUE (year, month, excel_file_id, sales_code);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ev_sales_sales_code ON public.ev_sales(sales_code);
CREATE INDEX IF NOT EXISTS idx_ev_sales_year ON public.ev_sales(year);
CREATE INDEX IF NOT EXISTS idx_ev_sales_year_month ON public.ev_sales(year, month);
CREATE INDEX IF NOT EXISTS idx_ev_sales_excel_file_id ON public.ev_sales(excel_file_id);
CREATE INDEX IF NOT EXISTS idx_ev_sales_sales_code_year_month ON public.ev_sales(sales_code, year, month);
CREATE INDEX IF NOT EXISTS idx_ev_sales_excel_file_data ON public.ev_sales USING GIN (excel_file_data);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.ev_sales ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 존재하는 경우를 대비)
DROP POLICY IF EXISTS "ev_sales_select_policy" ON public.ev_sales;
DROP POLICY IF EXISTS "ev_sales_insert_policy" ON public.ev_sales;
DROP POLICY IF EXISTS "ev_sales_update_policy" ON public.ev_sales;
DROP POLICY IF EXISTS "ev_sales_delete_policy" ON public.ev_sales;

-- RLS 정책: 인증된 사용자만 조회 가능
CREATE POLICY "ev_sales_select_policy" ON public.ev_sales
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "ev_sales_insert_policy" ON public.ev_sales
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
CREATE POLICY "ev_sales_update_policy" ON public.ev_sales
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "ev_sales_delete_policy" ON public.ev_sales
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_ev_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_ev_sales_updated_at
    BEFORE UPDATE ON public.ev_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_ev_sales_updated_at();

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE public.ev_sales IS '매출 관련 데이터를 관리하는 테이블 (엑셀 파일 데이터를 JSONB로 저장)';
COMMENT ON COLUMN public.ev_sales.id IS '고유 ID';
COMMENT ON COLUMN public.ev_sales.year IS '연도';
COMMENT ON COLUMN public.ev_sales.month IS '월 (1~12, NULL이면 연간 합계)';
COMMENT ON COLUMN public.ev_sales.notes IS '메모/비고';
COMMENT ON COLUMN public.ev_sales.created_at IS '생성일시';
COMMENT ON COLUMN public.ev_sales.updated_at IS '수정일시';
COMMENT ON COLUMN public.ev_sales.excel_file_id IS '엑셀 파일 ID (ev_excel_file 참조)';
COMMENT ON COLUMN public.ev_sales.sales_code IS '매출 코드 (env_code.code 참조)';
COMMENT ON COLUMN public.ev_sales.excel_file_data IS '엑셀 파일 데이터 (JSONB) - sales_code에 매칭된 모든 컬럼 데이터';
